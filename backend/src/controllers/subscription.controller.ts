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

      let sub = await Subscription.findOne({
        userId: req.user!.sub,
        status: { $in: ["active", "pending"] },
      })
        .sort({ createdAt: -1 })
        .lean();

      // If no personal active/pending sub, check for an active organization-level sub
      if ((!sub || sub.status !== 'active') && user.orgId) {
        const orgSub = await Subscription.findOne({
          orgId: user.orgId,
          status: "active",
        })
          .sort({ createdAt: -1 })
          .lean();
        
        if (orgSub) {
          sub = orgSub;
        }
      }

      const isOrgSub = !!(sub && sub.orgId);
      const effectiveTier = sub ? sub.plan : (user.tier || "free");

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

      // Fetch plan config if available
      let planConfig: {
        dailyChatLimit: number | null;
        hasPriorityBooking: boolean;
        therapistDiscount: number;
        hasUnlimitedJournal: boolean;
      } = {
        dailyChatLimit: 7,
        hasPriorityBooking: false,
        therapistDiscount: 0,
        hasUnlimitedJournal: false
      };

      if (sub && sub.planId) {
        const { SubscriptionPlan } = await import("@/models");
        const plan = await SubscriptionPlan.findById(sub.planId).lean();
        if (plan?.config) {
          planConfig = plan.config;
        }
      } else {
        // Fallback for legacy hardcoded tiers
        if (effectiveTier === "mann_shanti") {
          planConfig.dailyChatLimit = 100;
        } else if (effectiveTier === "apna_therapist" || isOrgSub) {
          planConfig.dailyChatLimit = null;
        }
      }

      const dailyLimit = planConfig.dailyChatLimit ?? Infinity;

      res.json({
        tier: effectiveTier,
        tierLabel: isOrgSub ? "Organization Premium" : (TIER_LABELS[effectiveTier] ?? effectiveTier),
        config: planConfig, // Send the dynamic config to frontend
        subscription: sub
          ? {
              id: sub._id,
              plan: sub.plan,
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate,
              razorpaySubscriptionId: sub.razorpaySubscriptionId,
              isOrganization: !!sub.orgId,
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
      try {
        const { tier } = req.body;
        console.log(`[Upgrade] Initiating upgrade for user ${req.user!.sub} to tier ${tier}`);
        
        const user = await User.findById(req.user!.sub).lean();
        if (!user) throw new AppError("User not found", 404);

        let finalTier = tier;
        let planName = tier;
        let razorpaySub: any;
        let isOrgPlan = false;

        if (["mann_shanti", "apna_therapist"].includes(tier)) {
          if (user.tier === tier) {
            throw new AppError("Already on this plan", 400);
          }
          const contactInfo = user.phoneMasked || (req.user as any)?.email || "customer@mindgod.com";
          razorpaySub = await SubscriptionService.createSubscription(tier, contactInfo);
        } else {
          // Dynamic Plan Support
          const { SubscriptionPlan } = await import("@/models");
          const dynamicPlan = await SubscriptionPlan.findById(tier);
          if (!dynamicPlan) throw new AppError("Invalid tier or plan ID", 400);

          if (dynamicPlan.audience === "organization") {
            if (user.role !== "org_admin" && user.role !== "super_admin") {
              throw new AppError("Only organization admins can purchase this plan", 403);
            }
            if (!user.orgId) {
              throw new AppError("User is not associated with any organization", 400);
            }
            isOrgPlan = true;
          }

          // Make sure it has a razorpayPlanId
          if (!dynamicPlan.razorpayPlanId) {
            console.log(`[Upgrade] Creating Razorpay plan for dynamic plan ${dynamicPlan.name}`);
            dynamicPlan.razorpayPlanId = await SubscriptionService.createRazorpayPlan(dynamicPlan.name, dynamicPlan.price);
            await SubscriptionPlan.findByIdAndUpdate(dynamicPlan._id, { razorpayPlanId: dynamicPlan.razorpayPlanId });
          }

          finalTier = dynamicPlan._id.toString();
          planName = dynamicPlan.name;
          // Razorpay requires an email or phone for notifications
          const contactInfo = user.phoneMasked || (req.user as any)?.email || "customer@mindgod.com";

          try {
            razorpaySub = await SubscriptionService.createDynamicSubscription(
              dynamicPlan.razorpayPlanId,
              dynamicPlan.name,
              contactInfo
            );
          } catch (err: any) {
            // If the stored plan ID is invalid (e.g. from a different account), clear it and retry once
            if (err.error?.description?.includes("invalid") || err.error?.code === "BAD_REQUEST_ERROR") {
              console.log(`[Upgrade] Stale Razorpay Plan ID detected (${dynamicPlan.razorpayPlanId}). Recreating...`);
              dynamicPlan.razorpayPlanId = await SubscriptionService.createRazorpayPlan(dynamicPlan.name, dynamicPlan.price);
              await SubscriptionPlan.findByIdAndUpdate(dynamicPlan._id, { razorpayPlanId: dynamicPlan.razorpayPlanId });
              
              razorpaySub = await SubscriptionService.createDynamicSubscription(
                dynamicPlan.razorpayPlanId,
                dynamicPlan.name,
                contactInfo
              );
            } else {
              throw err;
            }
          }
        }

        console.log(`[Upgrade] Razorpay subscription created: ${razorpaySub.subscriptionId}`);

        // Save pending subscription record (activated via webhook)
        await Subscription.create({
          userId: req.user!.sub,
          orgId: isOrgPlan ? user.orgId : undefined,
          planId: ["mann_shanti", "apna_therapist"].includes(tier) ? undefined : tier,
          plan: planName,
          status: "pending", // Will be activated via webhook
          razorpaySubscriptionId: razorpaySub.subscriptionId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        res.json({
          subscriptionId: razorpaySub.subscriptionId,
          shortUrl: razorpaySub.shortUrl,
          tier: finalTier,
          message: "Subscription created. Complete payment to activate.",
        });
      } catch (error: any) {
        console.error("[Upgrade Error]", error);
        throw new AppError(error.message || "Failed to create subscription", 500);
      }
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
          
          if (sub.userId) {
            const tier = SubscriptionService.tierFromPlanId(planId);
            if (tier) {
              await User.findByIdAndUpdate(sub.userId, { tier });
            }
          }
          // If it's an org sub, we don't update individual user tiers,
          // getMySubscription handles the benefit lookup.
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

  /** POST /subscription/demo-activate — create & activate a sub instantly (DEV ONLY) */
  static demoActivate = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Not allowed in production", 403);
      }

      const userId = req.user!.sub;
      console.log(`[demoActivate] userId=${userId}`);

      // Find any existing pending sub
      let sub = await Subscription.findOne({ userId, status: "pending" }).sort({ createdAt: -1 });
      console.log(`[demoActivate] existing pending sub=${sub?._id ?? "NONE"}`);

      if (sub) {
        sub.status = "active";
        await sub.save();
        console.log(`[demoActivate] activated existing pending sub`);
      } else {
        // Check if already active
        const existing = await Subscription.findOne({ userId, status: "active" }).sort({ createdAt: -1 });
        console.log(`[demoActivate] existing active sub=${existing?._id ?? "NONE"}`);
        if (existing) {
          // Already active — just make sure tier is set correctly
          await User.findByIdAndUpdate(userId, { tier: "apna_therapist" });
          return res.json({ message: "Already active", status: "active" });
        }

        // Create a brand new active dev subscription
        sub = await Subscription.create({
          userId,
          plan: "Dev Plan",
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        console.log(`[demoActivate] created new sub=${sub._id}`);
      }

      // Update user tier to non-free so middleware fallback also passes
      const updateResult = await User.findByIdAndUpdate(userId, { tier: "apna_therapist" }, { new: true }).select("tier _id");
      console.log(`[demoActivate] updated user tier: ${updateResult?.tier} for userId=${updateResult?._id}`);

      // Verify it was actually saved
      const verifySub = await Subscription.findOne({ userId, status: "active" }).lean();
      console.log(`[demoActivate] verify: activeSub=${verifySub?._id ?? "NONE"} status=${verifySub?.status}`);

      res.json({ message: "Subscription activated (Dev Mode)", status: "active" });
    },
  );

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
