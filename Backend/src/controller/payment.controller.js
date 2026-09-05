import RazorpayService from "../service/razorpay.service.js";
import ProductModel from "../model/product.model.js";
import OrderModel from "../model/order.model.js";
import AnalyticsModel from "../model/analytics.model.js";

const COUPONS = {
  SNITCH10: 0.10,
  FIRST10: 0.10,
  VIP20: 0.20,
};

function validateCoupon(code) {
  if (!code) return 0;
  return COUPONS[code.trim().toUpperCase()] ?? 0;
}

/**
 * POST /api/payment/create-order
 * Create a Razorpay Order for checkout
 */
export async function createRazorpayOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const { items: clientItems, coupon_code } = req.body;

    if (!clientItems?.length) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // 1. Re-fetch all products server-side
    const productIds = [...new Set(clientItems.map((i) => i.product_id))];
    const productMap = {};

    for (const pid of productIds) {
      const product = await ProductModel.findById(pid);
      if (!product || !product.is_active) {
        return res.status(400).json({ success: false, message: `Product ${pid} is unavailable.` });
      }
      productMap[pid] = product;
    }

    // 2. Validate line items
    const orderItems = [];
    let sellerId = null;

    for (const clientItem of clientItems) {
      const product = productMap[clientItem.product_id];
      if (!product) continue;

      if (product.stock < clientItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available for "${product.title}".`,
        });
      }

      sellerId = product.seller_id;
      orderItems.push({
        product_id: product.id,
        title: product.title,
        quantity: clientItem.quantity,
        unit_price: Number(product.price),
      });
    }

    // 3. Compute totals
    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const discountRate = validateCoupon(coupon_code);
    const discount_amount = Math.round(subtotal * discountRate * 100) / 100;
    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const finalTotal = Math.max(0, subtotal - discount_amount + shipping);

    const receiptId = `rcpt_${buyerId.substring(0, 6)}_${Date.now()}`;
    const razorpayOrder = await RazorpayService.createOrder(finalTotal, receiptId, {
      buyer_id: buyerId,
      seller_id: sellerId,
      item_count: orderItems.length,
    });

    return res.status(200).json({
      success: true,
      key: razorpayOrder.key,
      order_id: razorpayOrder.orderId,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      subtotal,
      discount_amount,
      shipping,
      finalTotal,
      prefill: {
        name: req.user.full_name || "",
        email: req.user.email || "",
        contact: req.user.mobile || "",
      },
    });
  } catch (err) {
    console.error("[createRazorpayOrder] error:", err);
    return res.status(500).json({ success: false, message: "Failed to initialize payment." });
  }
}

/**
 * POST /api/payment/verify
 * Verify payment signature and place confirmed order
 */
export async function verifyRazorpayPayment(req, res) {
  try {
    const buyerId = req.user.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items: clientItems,
      coupon_code,
      shipping_name,
      shipping_phone,
      shipping_line1,
      shipping_line2,
      shipping_city,
      shipping_state,
      shipping_postal,
      shipping_country = "IN",
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: "Missing payment identifiers." });
    }

    // 1. Verify Signature
    const isValid = RazorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed." });
    }

    if (!clientItems?.length) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // 2. Fetch server prices
    const productIds = [...new Set(clientItems.map((i) => i.product_id))];
    const productMap = {};

    for (const pid of productIds) {
      const product = await ProductModel.findById(pid);
      if (!product || !product.is_active) {
        return res.status(400).json({ success: false, message: `Product ${pid} is unavailable.` });
      }
      productMap[pid] = product;
    }

    const orderItems = [];
    let sellerId = null;

    for (const clientItem of clientItems) {
      const product = productMap[clientItem.product_id];
      if (!product) continue;
      sellerId = product.seller_id;

      orderItems.push({
        product_id: product.id,
        title: product.title,
        sku: product.sku || null,
        selected_size: clientItem.selected_size || null,
        selected_color: clientItem.selected_color || null,
        quantity: clientItem.quantity,
        unit_price: Number(product.price),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
        cover_image_url: product.cover_image_url || null,
      });
    }

    // 3. Compute totals
    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const discountRate = validateCoupon(coupon_code);
    const discount_amount = Math.round(subtotal * discountRate * 100) / 100;
    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - discount_amount + shipping);

    // 4. Decrement Stock
    await OrderModel.decrementStock(orderItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));

    // 5. Create Confirmed Order
    const order = await OrderModel.create({
      order: {
        buyer_id: buyerId,
        seller_id: sellerId,
        subtotal,
        discount_amount,
        total,
        coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null,
        payment_method: "razorpay",
        payment_status: "paid",
        shipping_name,
        shipping_phone,
        shipping_line1,
        shipping_line2: shipping_line2 || null,
        shipping_city,
        shipping_state,
        shipping_postal,
        shipping_country,
      },
      items: orderItems,
    });

    // 6. Track Analytics
    AnalyticsModel.track({
      seller_id: sellerId,
      event_type: "order_placed",
      revenue: total,
      metadata: {
        order_id: order.id,
        razorpay_order_id,
        razorpay_payment_id,
        payment_method: "razorpay",
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully!",
      order: { ...order, items: orderItems, payment_id: razorpay_payment_id },
    });
  } catch (err) {
    console.error("[verifyRazorpayPayment] error:", err);
    return res.status(500).json({ success: false, message: "Payment verification failed." });
  }
}
