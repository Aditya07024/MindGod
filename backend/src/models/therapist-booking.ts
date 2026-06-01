import mongoose, { Schema, type Document, type Types } from "mongoose";

interface IPayment {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  paid: boolean;
}

export interface ITherapistBooking extends Document {
  userId: Types.ObjectId;
  therapistId: Types.ObjectId;
  slot: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment: IPayment;
  videoRoomId?: string;
  therapistNotes?: string;
  rating?: number;
  review?: string;
  aiBrief?: string;
  journalShareState: "none" | "requested" | "approved" | "declined";
  payoutStatus?: "pending" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const TherapistBookingSchema = new Schema<ITherapistBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slot: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    },
    payment: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      amount: { type: Number, required: true },
      paid: { type: Boolean, default: false }
    },
    videoRoomId: { type: String },
    therapistNotes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    aiBrief: { type: String },
    journalShareState: {
      type: String,
      enum: ["none", "requested", "approved", "declined"],
      default: "none"
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

TherapistBookingSchema.index({ therapistId: 1, slot: 1 });

export const TherapistBooking = mongoose.model<ITherapistBooking>("TherapistBooking", TherapistBookingSchema);
