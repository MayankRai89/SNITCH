import CartModel from "../model/cart.model.js";
import ProductModel from "../model/product.model.js";

// ── Coupons ───────────────────────────────────────────────────────────────────
const COUPONS = {
  SNITCH10: 0.10,
  FIRST10: 0.10,
  VIP20: 0.20,
};

function getCouponDiscount(code) {
  if (!code) return { rate: 0, code: null };
  const normalized = code.trim().toUpperCase();
  const rate = COUPONS[normalized] || 0;
  return { rate, code: rate > 0 ? normalized : null };
}

function formatCartItem(item) {
  const prod = item.product || {};
  return {
    id: item.id,
    cartItemId: item.id,
    productId: item.product_id,
    title: prod.title || "Product",
    slug: prod.slug || "",
    coverImage: prod.images?.[0] || "",
    price: Number(prod.price || 0),
    compareAtPrice: prod.compare_at_price ? Number(prod.compare_at_price) : null,
    selectedSize: item.selected_size || "M",
    selectedColor: item.selected_color || "Standard",
    quantity: item.quantity || 1,
    sellerName: prod.seller?.store_name || "SNITCH Exclusive",
    maxStock: prod.stock ?? 99,
  };
}

/**
 * POST /api/cart/summary
 * Computes official server-validated pricing, discounts, shipping, and totals.
 * Works for both guest and logged-in carts.
 */
export async function calculateSummary(req, res) {
  try {
    const { items = [], couponCode = "" } = req.body;

    if (!items.length) {
      return res.status(200).json({
        success: true,
        summary: {
          itemCount: 0,
          subtotal: 0,
          originalSubtotal: 0,
          productSavings: 0,
          discountAmount: 0,
          discountRate: 0,
          couponCode: "",
          isCouponValid: false,
          shipping: 0,
          freeShippingThreshold: 999,
          freeShippingDifference: 999,
          freeShippingProgress: 0,
          finalTotal: 0,
          items: [],
        },
      });
    }

    // Re-fetch all products server-side to guarantee real prices & stock
    const productIds = [...new Set(items.map((i) => i.productId || i.product_id).filter(Boolean))];
    const productMap = {};

    for (const pid of productIds) {
      const product = await ProductModel.findById(pid);
      if (product && product.is_active) {
        productMap[pid] = product;
      }
    }

    let subtotal = 0;
    let originalSubtotal = 0;
    let totalItemCount = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = item.productId || item.product_id;
      const product = productMap[pid];
      if (!product) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(product.price || 0);
      const comparePrice = product.compare_at_price ? Number(product.compare_at_price) : unitPrice;

      const itemTotal = unitPrice * qty;
      const itemOriginalTotal = comparePrice * qty;

      subtotal += itemTotal;
      originalSubtotal += itemOriginalTotal;
      totalItemCount += qty;

      validatedItems.push({
        id: item.id || pid,
        productId: pid,
        title: product.title,
        price: unitPrice,
        compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : null,
        quantity: qty,
        selectedSize: item.selectedSize || item.selected_size || "M",
        selectedColor: item.selectedColor || item.selected_color || "Standard",
        inStock: (product.stock ?? 99) >= qty,
        maxStock: product.stock ?? 99,
      });
    }

    // Server-side coupon verification
    const { rate: discountRate, code: validCouponCode } = getCouponDiscount(couponCode);
    const discountAmount = Math.round(subtotal * discountRate * 100) / 100;

    // Shipping logic (Free above 999)
    const freeShippingThreshold = 999;
    const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
    const freeShippingDifference = Math.max(0, freeShippingThreshold - subtotal);
    const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

    const finalTotal = Math.max(0, subtotal - discountAmount + shipping);
    const productSavings = Math.max(0, originalSubtotal - subtotal);

    return res.status(200).json({
      success: true,
      summary: {
        itemCount: totalItemCount,
        subtotal,
        originalSubtotal,
        productSavings,
        discountAmount,
        discountRate,
        couponCode: validCouponCode || "",
        isCouponValid: Boolean(validCouponCode),
        shipping,
        freeShippingThreshold,
        freeShippingDifference,
        freeShippingProgress,
        finalTotal,
        items: validatedItems,
      },
    });
  } catch (err) {
    console.error("[calculateSummary] error:", err);
    return res.status(500).json({ success: false, message: "Failed to calculate cart summary" });
  }
}

/**
 * GET /api/cart
 * Get all cart items for logged in user
 */
export async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const items = await CartModel.findByUserId(userId);
    const formatted = items.map(formatCartItem);
    return res.status(200).json({ success: true, items: formatted });
  } catch (err) {
    console.error("[getCart] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
}

/**
 * POST /api/cart/items
 * Add an item to cart or increment quantity
 */
export async function addItem(req, res) {
  try {
    const userId = req.user.id;
    const { productId, selectedSize = "M", selectedColor = "Standard", quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // Verify product exists and is active
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: "Product not available" });
    }

    const item = await CartModel.addItem({
      userId,
      productId,
      selectedSize,
      selectedColor,
      quantity: Math.max(1, Number(quantity) || 1),
    });

    return res.status(200).json({
      success: true,
      message: "Item added to bag",
      item: formatCartItem(item),
    });
  } catch (err) {
    console.error("[addItem] error:", err);
    return res.status(500).json({ success: false, message: "Failed to add item to bag" });
  }
}

/**
 * PATCH /api/cart/items/:id
 * Update quantity for a cart item
 */
export async function updateQuantity(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ success: false, message: "Valid quantity is required" });
    }

    const item = await CartModel.updateQuantity({
      id,
      userId,
      quantity: Number(quantity),
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      item: item?.id ? formatCartItem(item) : null,
    });
  } catch (err) {
    console.error("[updateQuantity] error:", err);
    return res.status(500).json({ success: false, message: "Failed to update cart item" });
  }
}

/**
 * DELETE /api/cart/items/:id
 * Remove a single item from cart
 */
export async function removeItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await CartModel.removeItem({ id, userId });
    return res.status(200).json({ success: true, message: "Item removed from bag" });
  } catch (err) {
    console.error("[removeItem] error:", err);
    return res.status(500).json({ success: false, message: "Failed to remove item" });
  }
}

/**
 * DELETE /api/cart
 * Clear entire cart
 */
export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    await CartModel.clearCart(userId);
    return res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("[clearCart] error:", err);
    return res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
}

/**
 * POST /api/cart/sync
 * Sync / merge guest cart items into user's database cart upon login
 */
export async function syncCart(req, res) {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;

    const syncedItems = await CartModel.syncCart({ userId, items });
    const formatted = syncedItems.map(formatCartItem);

    return res.status(200).json({
      success: true,
      message: "Cart synced successfully",
      items: formatted,
    });
  } catch (err) {
    console.error("[syncCart] error:", err);
    return res.status(500).json({ success: false, message: "Failed to sync cart" });
  }
}
