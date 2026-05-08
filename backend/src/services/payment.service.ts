import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CreateOrderParams {
  amount: number;
  bookingId: string;
  userEmail?: string;
  userName?: string;
}

export class PaymentService {
  /**
   * Create a Razorpay order for a booking
   */
  static async createOrder({
    amount,
    bookingId,
    userEmail,
    userName,
  }: CreateOrderParams) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: `booking_${bookingId}`,
        notes: {
          bookingId,
          userEmail,
          userName,
        },
      });

      return {
        orderId: order.id,
        amount: order.amount / 100, // Convert back to rupees
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new Error("Failed to create payment order");
    }
  }

  /**
   * Verify payment signature from Razorpay webhook
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  /**
   * Fetch payment details from Razorpay
   */
  static async getPaymentDetails(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
      };
    } catch (error) {
      console.error("Failed to fetch payment details:", error);
      throw new Error("Failed to fetch payment details");
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(paymentId: string, amount?: number) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        status: refund.status,
        notes: refund.notes,
      };
    } catch (error) {
      console.error("Refund failed:", error);
      throw new Error("Failed to process refund");
    }
  }
}

export default PaymentService;
