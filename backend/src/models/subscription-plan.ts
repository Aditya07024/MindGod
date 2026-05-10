import mongoose, { Schema, type Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  features: string[];
  audience: "therapist" | "user" | "organization";
  isActive: boolean;
  config: {
    dailyChatLimit: number | null; // null for unlimited
    hasPriorityBooking: boolean;
    therapistDiscount: number; // percentage
    hasUnlimitedJournal: boolean;
  };
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
    config: {
      dailyChatLimit: { type: Number, default: 7 },
      hasPriorityBooking: { type: Boolean, default: false },
      therapistDiscount: { type: Number, default: 0 },
      hasUnlimitedJournal: { type: Boolean, default: false }
    },
    razorpayPlanId: { type: String }
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
