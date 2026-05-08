import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// In-memory cache of plan IDs (seeded from env or created on first use)
const PLAN_CACHE: Record<string, string | undefined> = {
  mann_shanti: process.env.RAZORPAY_PLAN_MANN_SHANTI,
  apna_therapist: process.env.RAZORPAY_PLAN_APNA_THERAPIST,
};

const PLAN_CONFIG = {
  mann_shanti: { amount: 19900, name: "Mann Shanti ₹199/mo", interval: 1, period: "monthly" as const },
  apna_therapist: { amount: 749900, name: "Apna Therapist ₹7499/mo", interval: 1, period: "monthly" as const },
};

export class SubscriptionService {
  /** Ensure a Razorpay Plan exists for the tier, create if missing */
  static async getOrCreatePlanId(tier: "mann_shanti" | "apna_therapist"): Promise<string> {
    if (PLAN_CACHE[tier]) return PLAN_CACHE[tier]!;

    const cfg = PLAN_CONFIG[tier];
    const plan = await razorpay.plans.create({
      period: cfg.period,
      interval: cfg.interval,
      item: {
        name: cfg.name,
        amount: cfg.amount,
        currency: "INR",
        description: `MindGod ${cfg.name} subscription`,
      },
    });

    PLAN_CACHE[tier] = plan.id;
    console.log(`[Subscription] Created Razorpay plan ${plan.id} for tier ${tier}`);
    return plan.id;
  }

  /** Create a Razorpay subscription for a user */
  static async createSubscription(
    tier: "mann_shanti" | "apna_therapist",
    userPhone: string,
  ) {
    const planId = await this.getOrCreatePlanId(tier);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 billing cycles = 1 year
      quantity: 1,
      notify_info: {
        notify_phone: userPhone,
      },
      notes: {
        tier,
        source: "mindgod_app",
      },
    });

    return {
      subscriptionId: subscription.id,
      shortUrl: (subscription as any).short_url ?? null,
      status: subscription.status,
    };
  }

  /** Cancel an active Razorpay subscription */
  static async cancelSubscription(razorpaySubId: string) {
    await razorpay.subscriptions.cancel(razorpaySubId);
  }

  /** Verify webhook signature from Razorpay */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return expected === signature;
  }

  /** Map Razorpay plan ID back to our tier */
  static tierFromPlanId(planId: string): "mann_shanti" | "apna_therapist" | null {
    for (const [tier, id] of Object.entries(PLAN_CACHE)) {
      if (id === planId) return tier as "mann_shanti" | "apna_therapist";
    }
    return null;
  }
}

export default SubscriptionService;
