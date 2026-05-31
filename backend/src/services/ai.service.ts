import crypto from "crypto";
import { AppError } from "@/lib/app-error";
import { Conversation, User, type IUser } from "@/models";

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

const MANAS_SYSTEM_PROMPT = `You are Manas AI.
You are a compassionate emotional wellness companion.
Your role is to:
* Listen carefully.
* Understand emotions.
* Respond with empathy.
* Help users reflect on situations.
* Ask thoughtful questions.
* Provide practical guidance.

Response style:
1. Acknowledge feelings.
2. Understand the situation.
3. Provide insights.
4. Suggest practical actions.
5. Ask a reflective follow-up question.

Keep responses meaningful and personalized.
Avoid:
* Generic advice
* Robotic wording
* Repeating the same phrases

Never claim to be a licensed therapist.
Never diagnose medical conditions.
If the user is in severe distress or unsafe, suggest they call/text the crisis line 14416 / 1800891446.`;

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

    const userConvs = await Conversation.find({
      userId,
      "messages.timestamp": { $gte: since },
    }).lean();

    const userMessagesToday = userConvs.reduce((sum, conv) => {
      return sum + (conv.messages?.filter(
        (m) => m.role === "user" && new Date(m.timestamp) >= since
      ).length ?? 0);
    }, 0);

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

  // Inject only relevant memories using keyword matching
  static getRelevantMemories(userMessage: string, memories: any[]): string[] {
    if (!memories || memories.length === 0) return [];

    const messageWords = new Set(
      userMessage
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const relevant: string[] = [];

    for (const memory of memories) {
      const memoryWords = memory.content
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 3);

      const hasOverlap = memoryWords.some((w: string) => messageWords.has(w));
      
      const categoryKeywords: Record<string, string[]> = {
        goal: ["goal", "want to", "aim", "plan", "future"],
        concern: ["concern", "worry", "anxious", "stress", "struggle"],
        relationship: ["family", "mother", "father", "friend", "partner", "wife", "husband", "son", "daughter", "boss", "colleague"],
        trigger: ["triggered", "trigger", "anxious when", "sad when", "angry when"],
        event: ["lost", "started", "moved", "died", "left", "happened"]
      };

      const categoryMatch = categoryKeywords[memory.category]?.some((kw) => 
        userMessage.toLowerCase().includes(kw)
      );

      if (hasOverlap || categoryMatch) {
        relevant.push(`[${memory.category.toUpperCase()}] ${memory.content}`);
      }
    }

    return relevant.slice(0, 3); // inject maximum of 3 memories to optimize tokens
  }

  // Rolling rolling summary generation
  static async summarizeConversation(conversation: any): Promise<string | null> {
    if (conversation.messages.length <= 10) return conversation.summary || null;

    const messagesToSummarize = conversation.messages.slice(0, -10);
    const formattedHistory = messagesToSummarize
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are updating the summary of an ongoing emotional wellness chat.
${conversation.summary ? `Previous summary: ${conversation.summary}\n\n` : ""}
New conversation turns to integrate into the summary:
${formattedHistory}

Write a brief, cumulative summary of the whole conversation, focusing on user goals, recurring concerns, relationships, triggers, and events. Keep it under 100 words.`;

    try {
      const summary = await this.queryBytez([
        { role: "system", content: "You are a helpful assistant that summarizes conversations concisely." },
        { role: "user", content: prompt }
      ]);
      if (summary) {
        conversation.summary = summary;
        await conversation.save();
        return summary;
      }
    } catch (err) {
      console.error("Failed to generate conversation summary:", err);
    }
    return conversation.summary || null;
  }

  // Extract factual memories from user message
  static async extractMemories(userId: string, userMessage: string, assistantReply: string) {
    const keywords = ["goal", "want to", "aim", "struggling with", "worry", "afraid", "scared", "always", "never", "mother", "father", "brother", "sister", "friend", "partner", "wife", "husband", "job", "work", "boss", "feel", "when I", "triggered", "anxious"];
    const lowerMessage = userMessage.toLowerCase();
    const hasKeywords = keywords.some((kw) => lowerMessage.includes(kw));

    if (!hasKeywords) return;

    const prompt = `You are a memory extraction assistant. Analyze the user message and extract key information about their goals, recurring concerns, relationship context, emotional triggers, and important life events.
Only extract information if it falls into one of these categories:
- goal: User goals
- concern: Recurring concerns
- relationship: Relationship context (family, friends, partner, etc.)
- trigger: Emotional triggers (what makes them anxious, sad, angry, etc.)
- event: Important life events (loss of job, relocation, breakups, etc.)

User message: "${userMessage}"
Assistant reply: "${assistantReply}"

Respond with a JSON array of extracted memories, or an empty array if nothing important is found. Do not write anything else.
Format: [{"category": "goal" | "concern" | "relationship" | "trigger" | "event", "content": "..."}]`;

    try {
      const resultText = await this.queryBytez([
        { role: "system", content: "You are a memory extractor. Reply only with valid JSON." },
        { role: "user", content: prompt }
      ]);

      if (resultText) {
        const cleaned = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const extracted = JSON.parse(cleaned);
        if (Array.isArray(extracted) && extracted.length > 0) {
          const user = await User.findById(userId);
          if (user) {
            if (!user.memories) user.memories = [];
            for (const item of extracted) {
              if (["goal", "concern", "relationship", "trigger", "event"].includes(item.category) && item.content) {
                user.memories.push({
                  category: item.category,
                  content: item.content,
                  timestamp: new Date()
                });
              }
            }
            if (user.memories.length > 50) {
              user.memories = user.memories.slice(-50);
            }
            await user.save();
          }
        }
      }
    } catch (err) {
      console.error("Failed to extract memories:", err);
    }
  }

  private static async fetchWithTimeout(url: string, options: any, timeoutMs = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  // Bytez API helpers with retry once on failure
  private static async queryBytez(
    messages: { role: string; content: string }[]
  ): Promise<string> {
    const apiKey = process.env.BYTEZ_API_KEY;
    const model = process.env.BYTEZ_MODEL || "Qwen/Qwen2.5-7B-Instruct";

    if (!apiKey) {
      throw new Error("BYTEZ_API_KEY is not configured");
    }

    let attempt = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        const response = await this.fetchWithTimeout("https://api.bytez.com/models/v2/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 220,
            temperature: 0.6,
            stream: false,
          }),
        }, 15000);

        if (!response.ok) {
          const errText = await response.text().catch(() => "API Error");
          throw new Error(`Bytez API error: ${response.status} - ${errText}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content?.trim() ?? "";
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt < maxAttempts) {
          console.warn(`Bytez API query failed, retrying (attempt ${attempt + 1}/${maxAttempts})...`, err);
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    throw lastError || new Error("Failed to query Bytez API");
  }

  private static async *queryBytezStream(
    messages: { role: string; content: string }[]
  ): AsyncGenerator<string> {
    const apiKey = process.env.BYTEZ_API_KEY;
    const model = process.env.BYTEZ_MODEL || "Qwen/Qwen2.5-7B-Instruct";

    if (!apiKey) {
      throw new Error("BYTEZ_API_KEY is not configured");
    }

    let attempt = 0;
    const maxAttempts = 2;
    let response: Response | null = null;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        response = await this.fetchWithTimeout("https://api.bytez.com/models/v2/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 220,
            temperature: 0.6,
            stream: true,
          }),
        }, 15000) as any;
        
        if (response && response.ok) {
          break;
        } else if (response) {
          const errText = await response.text().catch(() => "API Error");
          throw new Error(`Bytez API error: ${response.status} - ${errText}`);
        } else {
          throw new Error("No response received");
        }
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt < maxAttempts) {
          console.warn(`Bytez API connection failed, retrying (attempt ${attempt + 1}/${maxAttempts})...`, err);
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error("Failed to connect to Bytez API");
    }

    if (!response.body) {
      throw new Error("No response body received from Bytez API");
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const text = data.choices?.[0]?.delta?.content;
              if (text) {
                yield text;
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Assistant Reply logic - handles crisis or streams response from Bytez
  static async *streamReply(
    userId: string,
    message: string,
  ): AsyncGenerator<string> {
    const { conversation, crisis } = await this.appendUserMessage(userId, message);

    if (crisis) {
      const crisisReply = "I’m really glad you said that. If you may be in immediate danger or feel like you might act on this, call or text MANAS at 14416 / 1800891446 right now. Can you tell me if you are safe in this moment?";
      conversation.messages.push({
        role: "assistant",
        content: crisisReply,
        timestamp: new Date(),
      });
      await conversation.save();
      for (const token of crisisReply.split(" ")) {
        yield `${token} `;
      }
      return;
    }

    // Trigger rolling conversation summarization if message history is getting long
    if (conversation.messages.length > 10) {
      await this.summarizeConversation(conversation);
    }

    // Grab relevant background facts to inject
    const user = await User.findById(userId).lean();
    const relevantMemories = user?.memories ? this.getRelevantMemories(message, user.memories) : [];

    // Construct prompt
    const systemPromptParts = [MANAS_SYSTEM_PROMPT];
    if (conversation.summary) {
      systemPromptParts.push(`Summary of the conversation so far:\n${conversation.summary}`);
    }
    if (relevantMemories.length > 0) {
      systemPromptParts.push(`Relevant facts from previous conversations:\n${relevantMemories.map(m => `- ${m}`).join("\n")}`);
    }
    const systemPrompt = systemPromptParts.join("\n\n");

    // History: system prompt + last 10 messages + current user message
    const allMessages = conversation.messages;
    const historyMessages = allMessages.slice(0, -1);
    const last10History = historyMessages.slice(-10);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...last10History.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      { role: "user", content: message }
    ];

    let fullReply = "";
    try {
      for await (const chunk of this.queryBytezStream(apiMessages)) {
        fullReply += chunk;
        yield chunk;
      }
    } catch (err) {
      console.error("Bytez streamReply failed:", err);
      fullReply = "I'm having trouble responding right now. Please try again in a moment.";
      yield fullReply;
    }

    // Record response in DB
    conversation.messages.push({
      role: "assistant",
      content: fullReply,
      timestamp: new Date(),
    });
    await conversation.save();

    // Trigger background memory extraction if response succeeded
    if (fullReply && fullReply !== "I'm having trouble responding right now. Please try again in a moment.") {
      this.extractMemories(userId, message, fullReply).catch((e) => {
        console.error("Background fact memory extraction failed:", e);
      });
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
}
