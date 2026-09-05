import OrderModel from "../model/order.model.js";
import SellerModel from "../model/seller.model.js";
import ProductModel from "../model/product.model.js";
import AnalyticsModel from "../model/analytics.model.js";

// ── Coupon validation (server-side only, never trust client) ──────────────────
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
 * POST /api/orders
 * Buyer creates a new order. Server re-fetches all prices — never trusts client prices.
 */
export async function createOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const {
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
      payment_method = "cod",
    } = req.body;

    if (!clientItems?.length) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    if (!shipping_name || !shipping_phone || !shipping_line1 || !shipping_city || !shipping_state || !shipping_postal) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required." });
    }

    // 1. Re-fetch all products server-side — NEVER trust client prices
    const productIds = [...new Set(clientItems.map((i) => i.product_id))];
    const productMap = {};

    for (const pid of productIds) {
      const product = await ProductModel.findById(pid);
      if (!product || !product.is_active) {
        return res.status(400).json({ success: false, message: `Product ${pid} is unavailable.` });
      }
      productMap[pid] = product;
    }

    // 2. Build validated line items using server prices
    const orderItems = [];
    let sellerId = null;

    for (const clientItem of clientItems) {
      const product = productMap[clientItem.product_id];
      if (!product) continue;

      // Enforce stock
      if (product.stock < clientItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available for "${product.title}".`,
        });
      }

      // All items must be from the same seller (single-seller cart for MVP)
      if (sellerId && product.seller_id !== sellerId) {
        return res.status(400).json({
          success: false,
          message: "Your cart contains products from multiple sellers. Please checkout each seller separately.",
        });
      }
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

    // 3. Compute totals server-side
    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const discountRate = validateCoupon(coupon_code);
    const discount_amount = Math.round(subtotal * discountRate * 100) / 100;
    const total = Math.max(0, subtotal - discount_amount);

    // 4. Decrement stock
    await OrderModel.decrementStock(orderItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));

    // 5. Create order record
    const order = await OrderModel.create({
      order: {
        buyer_id: buyerId,
        seller_id: sellerId,
        subtotal,
        discount_amount,
        total,
        coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null,
        payment_method,
        payment_status: payment_method === "cod" ? "pending" : "pending",
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

    // 6. Track analytics event (non-blocking)
    AnalyticsModel.track({
      seller_id: sellerId,
      event_type: "order_placed",
      revenue: total,
      metadata: { order_id: order.id, item_count: orderItems.length },
    }).catch(() => {}); // analytics failure must never break checkout

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: { ...order, items: orderItems },
    });
  } catch (err) {
    console.error("[createOrder] error:", err);
    if (err.message?.includes("Insufficient stock")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Failed to place order." });
  }
}

/**
 * GET /api/orders/me
 * Buyer: list all own orders
 */
export async function getMyOrders(req, res) {
  try {
    const buyerId = req.user.id;
    const orders = await OrderModel.findByBuyerId(buyerId);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("[getMyOrders] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
}

/**
 * GET /api/orders/:id
 * Buyer: get single order detail (ownership enforced)
 */
export async function getOrderById(req, res) {
  try {
    const buyerId = req.user.id;
    const order = await OrderModel.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.buyer_id !== buyerId) return res.status(403).json({ success: false, message: "Access denied." });

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("[getOrderById] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch order." });
  }
}

/**
 * PUT /api/orders/:id/cancel
 * Buyer cancels their own pending order
 */
export async function cancelOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const order = await OrderModel.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.buyer_id !== buyerId) return res.status(403).json({ success: false, message: "Access denied." });
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is ${order.status}.` });
    }

    // Restore stock
    await OrderModel.restoreStock(order.id);

    const updated = await OrderModel.updateStatus(order.id, "cancelled", {
      cancel_reason: req.body.reason || "Cancelled by buyer",
    });

    return res.status(200).json({ success: true, message: "Order cancelled.", order: updated });
  } catch (err) {
    console.error("[cancelOrder] error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
}

// ── Seller Order Endpoints ────────────────────────────────────────────────────

/**
 * GET /api/orders/seller/me
 * Seller: list all orders for their store
 */
export async function getSellerOrders(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) return res.status(403).json({ success: false, message: "Seller profile not found." });

    const orders = await OrderModel.findBySellerId(seller.id);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("[getSellerOrders] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
}

/**
 * PUT /api/orders/:id/status
 * Seller: update order status (confirm → processing → shipped → delivered)
 */
export async function updateOrderStatus(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    const ALLOWED_SELLER_TRANSITIONS = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped"],
      shipped: ["delivered"],
    };

    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    // Verify seller owns this order
    const seller = await SellerModel.findByUserId(userId);
    if (!seller || order.seller_id !== seller.id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const allowed = ALLOWED_SELLER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${order.status}" to "${status}".`,
      });
    }

    // Handle cancellation: restore stock
    if (status === "cancelled") {
      await OrderModel.restoreStock(order.id);
    }

    const updated = await OrderModel.updateStatus(order.id, status);
    return res.status(200).json({ success: true, order: updated });
  } catch (err) {
    console.error("[updateOrderStatus] error:", err);
    return res.status(500).json({ success: false, message: "Failed to update order status." });
  }
}
