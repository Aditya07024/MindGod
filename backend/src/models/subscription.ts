import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  plan: "free" | "mann_shanti" | "apna_therapist";
  status: "active" | "cancelled" | "expired";
  razorpaySubscriptionId?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: {
      type: String,
      enum: ["free", "mann_shanti", "apna_therapist"],
      required: true
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active"
    },
    razorpaySubscriptionId: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
