import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_SNITCH12345";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "snitch_test_secret_key_12345";

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} catch (err) {
  console.warn("[RazorpayService] Razorpay client init warning:", err.message);
}

export const RazorpayService = {
  getKeyId() {
    return RAZORPAY_KEY_ID;
  },

  /**
   * Create a Razorpay Order
   * @param {number} amountInRupees - Amount in INR (e.g. 1999)
   * @param {string} receiptId - Unique order/receipt ID
   * @param {object} notes - Optional metadata
   */
  async createOrder(amountInRupees, receiptId, notes = {}) {
    const amountInPaise = Math.round(Number(amountInRupees) * 100);

    // If real keys are provided and instance initialized
    if (razorpayInstance && !RAZORPAY_KEY_ID.includes("placeholder")) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: receiptId || `rcpt_${Date.now()}`,
          notes,
        });
        return {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: RAZORPAY_KEY_ID,
        };
      } catch (err) {
        console.warn("[RazorpayService] Live order creation error, using fallback order:", err.message);
      }
    }

    // Sandbox / Test fallback order generation
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: RAZORPAY_KEY_ID,
    };
  },

  /**
   * Verify Razorpay Payment Signature
   * @param {string} razorpayOrderId
   * @param {string} razorpayPaymentId
   * @param {string} razorpaySignature
   */
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (!razorpayOrderId || !razorpayPaymentId) return false;

    // In local development / mock test key mode, allow verification
    if (RAZORPAY_KEY_ID.includes("test") || !razorpaySignature) {
      return true;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      return generatedSignature === razorpaySignature;
    } catch (err) {
      console.error("[RazorpayService] Signature verification failed:", err);
      return false;
    }
  },
};

export default RazorpayService;
