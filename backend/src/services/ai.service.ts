import crypto from "crypto";
import { AppError } from "@/lib/app-error";
import { Conversation, User, type IUser } from "@/models";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const CRISIS_KEYWORDS = [
  "want to die",
  "kill myself",
  "end my life",
  "suicide",
  "can't go on",
  "hurt myself",
];

const PLAN_LIMITS: Record<IUser["tier"], number> = {
  free: 7,
  mann_shanti: 100,
  apna_therapist: Number.POSITIVE_INFINITY,
};

const MANAS_SYSTEM_PROMPT = `You are Manas, Mindsyncpro's AI wellness companion for India.
- You are an AI, NOT a therapist. Always disclose your AI identity naturally; never pretend to be human.
- Never diagnose, prescribe, or give medical advice.
- Keep replies under 150 words.
- Use warm, empathetic, and culturally fluent language for India. Reference the Indian context naturally when appropriate (e.g., family pressure, academic anxiety, career stress).
- Use gentle CBT and mindfulness reflections to help users notice and reframe automatic thoughts.
- End with exactly one thoughtful follow-up question.
- If the user sounds unsafe, prioritize safety and direct them to the crisis line 14416 / 1800891446.`;

export class AIService {
  static detectCrisis(text: string): boolean {
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
  }

  static getDailyMessageLimit(tier: IUser["tier"]): number {
    return PLAN_LIMITS[tier];
  }

  static async ensureChatQuota(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const conversation = await Conversation.findOne({
      userId,
      createdAt: { $gte: since },
    }).sort({ createdAt: -1 });

    const userMessagesToday =
      conversation?.messages.filter((message) => message.role === "user")
        .length ?? 0;

    let limit = this.getDailyMessageLimit(user.tier);

    // Look for active subscription to override legacy tier limits
    const { Subscription } = await import("@/models");
    const activeSub = await Subscription.findOne({
      userId,
      status: "active",
    }).lean();

    if (activeSub) {
      if (activeSub.planId) {
        const { SubscriptionPlan } = await import("@/models");
        const plan = await SubscriptionPlan.findById(activeSub.planId).lean();
        if (plan?.config && plan.config.dailyChatLimit !== undefined) {
          limit = plan.config.dailyChatLimit ?? Number.POSITIVE_INFINITY;
        }
      } else {
        // Fallback for legacy plans in subscription records
        if (activeSub.plan === "Mann Shanti") {
          limit = 100;
        } else if (activeSub.plan === "Apna Therapist") {
          limit = Number.POSITIVE_INFINITY;
        }
      }
    } else if (user.orgId) {
      // Check org subscription
      const activeOrgSub = await Subscription.findOne({
        orgId: user.orgId,
        status: "active",
      }).lean();
      
      if (activeOrgSub) {
        if (activeOrgSub.planId) {
          const { SubscriptionPlan } = await import("@/models");
          const plan = await SubscriptionPlan.findById(activeOrgSub.planId).lean();
          if (plan?.config && plan.config.dailyChatLimit !== undefined) {
            limit = plan.config.dailyChatLimit ?? Number.POSITIVE_INFINITY;
          }
        } else {
          // org plans by default get unlimited chat
          limit = Number.POSITIVE_INFINITY;
        }
      }
    }

    if (userMessagesToday >= limit) {
      throw new AppError("Daily chat limit reached", 429);
    }

    return {
      user,
      remaining: Number.isFinite(limit)
        ? Math.max(limit - userMessagesToday, 0)
        : null,
    };
  }

  static async getOrCreateConversation(userId: string) {
    let conversation = await Conversation.findOne({ userId }).sort({
      updatedAt: -1,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        sessionId: crypto.randomUUID(),
        messages: [],
      });
    }

    return conversation;
  }

  static async appendUserMessage(userId: string, message: string) {
    const conversation = await this.getOrCreateConversation(userId);
    const crisis = this.detectCrisis(message);

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    if (crisis) {
      conversation.riskLevel = "high";
      conversation.escalated = true;

      // Trigger high-severity crisis notification to super admin
      try {
        const seeker = await User.findById(userId).select("fullName").lean();
        const seekerName = seeker?.fullName || "A Seeker";
        const superAdmins = await User.find({ role: "super_admin" }).select("_id").lean();
        const notificationBody = `Distress alert: Seeker "${seekerName}" has triggered a crisis flag. Context: "${message.slice(0, 150)}..."`;

        const { NotificationController } = require("@/controllers/notification.controller");
        for (const admin of superAdmins) {
          await NotificationController.createNotification(
            admin._id.toString(),
            "⚠️ High-Risk Seeker Alert",
            notificationBody,
            "crisis_alert",
            { conversationId: conversation._id.toString(), userId }
          );
        }
      } catch (err) {
        console.error("[Notifications] Failed sending crisis flag to super admins:", err);
      }
    }

    await conversation.save();
    return { conversation, crisis };
  }

  static async createAssistantReply(
    message: string,
    history: { role: string; content: string }[],
  ) {
    const crisis = this.detectCrisis(message);

    if (crisis) {
      return "I’m really glad you said that. If you may be in immediate danger or feel like you might act on this, call or text MANAS at 14416 / 1800891446 right now. Can you tell me if you are safe in this moment?";
    }

    const groqReply = await this.tryGroq(history);
    if (groqReply) {
      return groqReply;
    }

    const geminiReply = await this.tryGemini(history);
    if (geminiReply) {
      return geminiReply;
    }

    return "I’m here with you. I’m having technical trouble right now, but we can slow this down together. What feels heaviest in this moment?";
  }

  static async *streamReply(
    userId: string,
    message: string,
  ): AsyncGenerator<string> {
    const { conversation } = await this.appendUserMessage(userId, message);
    const history = conversation.messages.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
    const reply = await this.createAssistantReply(message, history);

    conversation.messages.push({
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    });

    await conversation.save();

    for (const token of reply.split(" ")) {
      yield `${token} `;
    }
  }

  static async getConversationHistory(userId: string) {
    const conversation = await Conversation.findOne({ userId }).sort({
      updatedAt: -1,
    });
    if (!conversation) {
      return {
        sessionId: null,
        riskLevel: "low",
        escalated: false,
        messages: [],
      };
    }

    return {
      sessionId: conversation.sessionId,
      riskLevel: conversation.riskLevel,
      escalated: conversation.escalated,
      messages: conversation.messages,
    };
  }

  private static async tryGroq(history: { role: string; content: string }[]) {
    if (!process.env.GROQ_API_KEY) {
      return null;
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 220,
        messages: [
          { role: "system", content: MANAS_SYSTEM_PROMPT },
          ...history,
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  }

  private static async tryGemini(history: { role: string; content: string }[]) {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }

    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${MANAS_SYSTEM_PROMPT}\n\n${history
                    .map((entry) => `${entry.role}: ${entry.content}`)
                    .join("\n")}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  }
}
