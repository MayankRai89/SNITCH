import AnalyticsModel from "../model/analytics.model.js";
import SellerModel from "../model/seller.model.js";

/**
 * GET /api/analytics/summary
 * Seller: get top-line stats for dashboard
 */
export async function getAnalyticsSummary(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) return res.status(403).json({ success: false, message: "Seller profile not found." });

    const days = parseInt(req.query.days) || 30;
    const summary = await AnalyticsModel.getSummary(seller.id, days);

    return res.status(200).json({ success: true, ...summary });
  } catch (err) {
    console.error("[getAnalyticsSummary] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics." });
  }
}

/**
 * GET /api/analytics/products
 * Seller: per-product revenue and units breakdown
 */
export async function getProductAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) return res.status(403).json({ success: false, message: "Seller profile not found." });

    const products = await AnalyticsModel.getProductBreakdown(seller.id);
    return res.status(200).json({ success: true, products });
  } catch (err) {
    console.error("[getProductAnalytics] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch product analytics." });
  }
}

/**
 * POST /api/analytics/event
 * Public: track product view / add-to-cart event from frontend
 * Rate limited — this endpoint does NOT require auth
 */
export async function trackEvent(req, res) {
  try {
    const { seller_id, product_id, event_type } = req.body;

    const ALLOWED_PUBLIC_EVENTS = ["product_view", "add_to_cart"];
    if (!ALLOWED_PUBLIC_EVENTS.includes(event_type)) {
      return res.status(400).json({ success: false, message: "Invalid event type." });
    }
    if (!seller_id) return res.status(400).json({ success: false, message: "seller_id is required." });

    // Fire-and-forget — never block the client
    AnalyticsModel.track({ seller_id, product_id: product_id || null, event_type }).catch(() => {});

    return res.status(202).json({ success: true });
  } catch (err) {
    return res.status(202).json({ success: true }); // Always 202 for tracking calls
  }
}
