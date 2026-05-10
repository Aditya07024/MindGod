import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { SubscriptionPlan } from "@/models";

export class PlanController {
  
  /** GET /plans — Fetch all active plans (can optionally filter by audience) */
  static getPlans = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { audience } = req.query;
    
    const query: any = { isActive: true };
    if (audience) {
      query.audience = audience;
    }

    const plans = await SubscriptionPlan.find(query).sort({ price: 1 }).lean();
    res.json({ plans });
  });

  /** POST /admin/plans — Create a new plan */
  static createPlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { name, price, features, audience, config, password } = req.body;

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    if (!name || typeof price !== 'number' || !audience) {
      return res.status(400).json({ error: "Missing required fields (name, price, audience)" });
    }

    const plan = new SubscriptionPlan({
      name,
      price,
      features: features || [],
      audience,
      config: config || {
        dailyChatLimit: 7,
        hasPriorityBooking: false,
        therapistDiscount: 0,
        hasUnlimitedJournal: false
      },
      isActive: true
    });

    await plan.save();
    res.status(201).json({ plan, message: "Plan created successfully" });
  });

  /** PUT /admin/plans/:id — Update an existing plan */
  static updatePlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { name, price, features, audience, config, isActive, password } = req.body;

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(typeof price === 'number' && { price }),
        ...(features && { features }),
        ...(audience && { audience }),
        ...(config && { config }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      { new: true }
    );

    if (!plan) return res.status(404).json({ error: "Plan not found" });

    res.json({ plan, message: "Plan updated successfully" });
  });

  /** DELETE /admin/plans/:id — Soft delete a plan */
  static deletePlan = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    res.json({ message: "Plan marked as inactive" });
  });
}
