import mongoose, { Schema, type Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  features: string[];
  audience: "therapist" | "user" | "organization";
  isActive: boolean;
  razorpayPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    audience: {
      type: String,
      enum: ["therapist", "user", "organization"],
      required: true
    },
    isActive: { type: Boolean, default: true },
    razorpayPlanId: { type: String }
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
