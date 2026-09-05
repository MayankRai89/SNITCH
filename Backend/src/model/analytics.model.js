import supabase from "../config/supabaseClient.js";

const AnalyticsModel = {
  /**
   * Fire-and-forget event tracking.
   * Always resolves (never throws) — analytics must not break core flows.
   */
  async track({ seller_id, product_id = null, event_type, revenue = null, metadata = null }) {
    try {
      await supabase.from("seller_events").insert([{
        seller_id,
        product_id,
        event_type,
        revenue,
        metadata,
      }]);
    } catch (err) {
      console.warn("[AnalyticsModel.track] failed silently:", err.message);
    }
  },

  /**
   * Get seller summary stats for the dashboard
   */
  async getSummary(sellerId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Revenue & order count
    const { data: events } = await supabase
      .from("seller_events")
      .select("event_type, revenue, created_at, product_id")
      .eq("seller_id", sellerId)
      .gte("created_at", since);

    const orderEvents = (events || []).filter((e) => e.event_type === "order_placed");
    const totalRevenue = orderEvents.reduce((sum, e) => sum + (Number(e.revenue) || 0), 0);
    const totalOrders = orderEvents.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalViews = (events || []).filter((e) => e.event_type === "product_view").length;
    const totalAddToCart = (events || []).filter((e) => e.event_type === "add_to_cart").length;

    // Revenue per day (for sparkline chart)
    const revenueByDay = {};
    for (const e of orderEvents) {
      const day = e.created_at?.substring(0, 10);
      if (day) revenueByDay[day] = (revenueByDay[day] || 0) + (Number(e.revenue) || 0);
    }
    const revenueTimeline = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalViews,
      totalAddToCart,
      revenueTimeline,
      period: `Last ${days} days`,
    };
  },

  /**
   * Get per-product breakdown for seller
   */
  async getProductBreakdown(sellerId) {
    const { data: orders } = await supabase
      .from("orders")
      .select("total, items:order_items(product_id, title, quantity, unit_price, cover_image_url)")
      .eq("seller_id", sellerId)
      .in("status", ["confirmed", "processing", "shipped", "delivered"]);

    const productMap = {};
    for (const order of orders || []) {
      for (const item of order.items || []) {
        const pid = item.product_id;
        if (!productMap[pid]) {
          productMap[pid] = {
            product_id: pid,
            title: item.title,
            cover_image_url: item.cover_image_url,
            units_sold: 0,
            revenue: 0,
          };
        }
        productMap[pid].units_sold += item.quantity;
        productMap[pid].revenue += item.unit_price * item.quantity;
      }
    }

    return Object.values(productMap)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  },
};

export default AnalyticsModel;
