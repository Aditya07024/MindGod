import { JournalEntry, User } from "@/models";

const PROMPTS = [
  "What thought hit hardest today?",
  "Which moment made your body tense up today?",
  "What did your mind assume, and what actually happened?",
  "If your closest friend said this about themselves, what would you tell them?",
  "What is a gentler and more accurate way to see this situation?"
];

export class JournalService {
  static getWeeklyLimit(tier: "free" | "mann_shanti" | "apna_therapist") {
    return tier === "free" ? 3 : Number.POSITIVE_INFINITY;
  }

  static async createJournalEntry(
    userId: string,
    prompt: string,
    situation: string,
    thought: string,
    feeling: string,
    reframe: string
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const weeklyLimit = this.getWeeklyLimit(user.tier);
    if (Number.isFinite(weeklyLimit)) {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const count = await JournalEntry.countDocuments({ userId, createdAt: { $gte: since } });
      if (count >= weeklyLimit) {
        throw new Error("Weekly journal limit reached");
      }
    }

    const aiResponse =
      user.tier === "free"
        ? undefined
        : "You’re noticing a painful automatic thought and already starting to loosen its grip. What evidence supports the more balanced view you wrote?";

    return JournalEntry.create({
      userId,
      prompt,
      situation,
      thought,
      feeling,
      reframe,
      aiResponse
    });
  }

  static async getJournalEntries(userId: string, limit = 20) {
    return JournalEntry.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  static async getJournalAnalytics(userId: string) {
    const entries = await JournalEntry.find({ userId });
    const feelings = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.feeling] = (acc[entry.feeling] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totalEntries: entries.length,
      feelings,
      recentPrompts: entries.slice(0, 5).map((entry) => entry.prompt)
    };
  }

  static getRandomPrompt() {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }
}
