/**
 * Payment API Service for Razorpay Order Creation and Payment Verification
 */

export const paymentService = {
  /**
   * Create Razorpay Order from server
   */
  async createOrder({ items, couponCode }) {
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.productId || i.id,
          quantity: i.quantity,
          selected_size: i.selectedSize,
          selected_color: i.selectedColor,
        })),
        coupon_code: couponCode,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to initialize Razorpay order" }));
      throw new Error(err.message || "Failed to initialize Razorpay order");
    }

    return await res.json();
  },

  /**
   * Verify Razorpay Payment Signature and place confirmed order
   */
  async verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    items,
    couponCode,
    shippingAddress,
  }) {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        items: items.map((i) => ({
          product_id: i.productId || i.id,
          quantity: i.quantity,
          selected_size: i.selectedSize,
          selected_color: i.selectedColor,
        })),
        coupon_code: couponCode,
        shipping_name: shippingAddress.fullName,
        shipping_phone: shippingAddress.phone,
        shipping_line1: shippingAddress.street,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state || "Delhi",
        shipping_postal: shippingAddress.pincode,
        shipping_country: "IN",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Payment verification failed" }));
      throw new Error(err.message || "Payment verification failed");
    }

    return await res.json();
  },

  /**
   * Cash On Delivery Checkout
   */
  async createCodOrder({ items, couponCode, shippingAddress }) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: items.map((i) => ({
          product_id: i.productId || i.id,
          quantity: i.quantity,
          selected_size: i.selectedSize,
          selected_color: i.selectedColor,
        })),
        coupon_code: couponCode,
        payment_method: "cod",
        shipping_name: shippingAddress.fullName,
        shipping_phone: shippingAddress.phone,
        shipping_line1: shippingAddress.street,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state || "Delhi",
        shipping_postal: shippingAddress.pincode,
        shipping_country: "IN",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to place order" }));
      throw new Error(err.message || "Failed to place order");
    }

    return await res.json();
  },
};

export default paymentService;
