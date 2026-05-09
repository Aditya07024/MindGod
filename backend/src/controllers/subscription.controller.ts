import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, Subscription } from "@/models";
import { AppError } from "@/lib/app-error";
import SubscriptionService from "@/services/subscription.service";

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  mann_shanti: "Mann Shanti",
  apna_therapist: "Apna Therapist",
};

export class SubscriptionController {
  /** GET /subscription — get current user's tier + usage */
  static getMySubscription = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const user = await User.findById(req.user!.sub).lean();
      if (!user) throw new AppError("User not found", 404);

      const sub = await Subscription.findOne({
        userId: req.user!.sub,
        status: { $in: ["active", "pending"] },
        plan: { $ne: "free" },
      })
        .sort({ createdAt: -1 })
        .lean();

      // Calculate messages used today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { Conversation } = await import("@/models");
      const conv = await Conversation.findOne({
        userId: req.user!.sub,
        createdAt: { $gte: today },
      }).lean();
      const messagesUsedToday =
        conv?.messages.filter((m) => m.role === "user").length ?? 0;

      const dailyLimit =
        user.tier === "free" ? 7 : user.tier === "mann_shanti" ? 100 : Infinity;

      res.json({
        tier: user.tier,
        tierLabel: TIER_LABELS[user.tier] ?? user.tier,
        subscription: sub
          ? {
              id: sub._id,
              plan: sub.plan,
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate,
              razorpaySubscriptionId: sub.razorpaySubscriptionId,
            }
          : null,
        usage: {
          messagesUsedToday,
          dailyLimit: Number.isFinite(dailyLimit) ? dailyLimit : null,
          messagesRemainingToday: Number.isFinite(dailyLimit)
            ? Math.max(0, (dailyLimit as number) - messagesUsedToday)
            : null,
        },
      });
    },
  );

  /** POST /subscription/upgrade — create Razorpay recurring subscription */
  static upgradeSubscription = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { tier } = req.body;
      
      const user = await User.findById(req.user!.sub).lean();
      if (!user) throw new AppError("User not found", 404);

      let finalTier = tier;
      let planName = tier;
      let razorpaySub: any;

      if (["mann_shanti", "apna_therapist"].includes(tier)) {
        if (user.tier === tier) {
          throw new AppError("Already on this plan", 400);
        }
        razorpaySub = await SubscriptionService.createSubscription(tier, user.phoneMasked);
      } else {
        // Dynamic Plan Support
        const { SubscriptionPlan } = await import("@/models");
        const dynamicPlan = await SubscriptionPlan.findById(tier);
        if (!dynamicPlan) throw new AppError("Invalid tier or plan ID", 400);

        // Make sure it has a razorpayPlanId
        if (!dynamicPlan.razorpayPlanId) {
          dynamicPlan.razorpayPlanId = await SubscriptionService.createRazorpayPlan(dynamicPlan.name, dynamicPlan.price);
          await dynamicPlan.save();
        }

        finalTier = dynamicPlan._id.toString();
        planName = dynamicPlan.name;
        razorpaySub = await SubscriptionService.createDynamicSubscription(
          dynamicPlan.razorpayPlanId,
          dynamicPlan.name,
          user.phoneMasked
        );
      }

      // Save pending subscription record (activated via webhook)
      await Subscription.create({
        userId: req.user!.sub,
        plan: planName,
        status: "pending", // Will be activated via webhook
        razorpaySubscriptionId: razorpaySub.subscriptionId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Webhook will update user tier upon successful payment confirmation

      res.json({
        subscriptionId: razorpaySub.subscriptionId,
        shortUrl: razorpaySub.shortUrl,
        tier: finalTier,
        message: "Subscription created. Complete payment to activate.",
      });
    },
  );

  /** POST /subscription/cancel — cancel active subscription */
  static cancelSubscription = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const activeSub = await Subscription.findOne({
        userId: req.user!.sub,
        status: "active",
        plan: { $ne: "free" },
      });

      if (!activeSub) throw new AppError("No active subscription found", 404);

      if (activeSub.razorpaySubscriptionId) {
        await SubscriptionService.cancelSubscription(
          activeSub.razorpaySubscriptionId,
        );
      }

      activeSub.status = "cancelled";
      await activeSub.save();

      // Downgrade user tier to free
      await User.findByIdAndUpdate(req.user!.sub, { tier: "free" });

      res.json({ message: "Subscription cancelled. You have been moved to the Free plan." });
    },
  );

  /** POST /subscription/webhook — Razorpay subscription webhook */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!SubscriptionService.verifyWebhookSignature(body, signature)) {
      throw new AppError("Invalid webhook signature", 400);
    }

    const event = req.body;
    const subId = event?.payload?.subscription?.entity?.id;
    const planId = event?.payload?.subscription?.entity?.plan_id;

    if (!subId) {
      return res.json({ received: true });
    }

    const sub = await Subscription.findOne({
      razorpaySubscriptionId: subId,
    });

    switch (event.event) {
      case "subscription.activated": {
        if (sub) {
          sub.status = "active";
          await sub.save();
          const tier = SubscriptionService.tierFromPlanId(planId);
          if (tier) {
            await User.findByIdAndUpdate(sub.userId, { tier });
          }
        }
        break;
      }
      case "subscription.cancelled":
      case "subscription.expired": {
        if (sub) {
          sub.status = event.event === "subscription.cancelled" ? "cancelled" : "expired";
          await sub.save();
          await User.findByIdAndUpdate(sub.userId, { tier: "free" });
        }
        break;
      }
      case "subscription.charged": {
        // Subscription renewed — extend endDate by 30 days
        if (sub) {
          sub.endDate = new Date(
            (sub.endDate ?? new Date()).getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          await sub.save();
        }
        break;
      }
    }

    res.json({ received: true });
  });

  /** GET /subscription/admin/all — Super admin: list all subscriptions */
  static adminListAll = asyncHandler(
    async (_req: AuthedRequest, res: Response) => {
      const subs = await Subscription.find()
        .populate({
          path: "userId",
          select: "fullName role therapistProfile orgId",
          populate: { path: "orgId", select: "name" }
        })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

      res.json({ subscriptions: subs, total: subs.length });
    },
  );
}

export default SubscriptionController;
