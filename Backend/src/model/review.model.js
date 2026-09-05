import supabase from "../config/supabaseClient.js";

const ReviewModel = {
  /**
   * Create a review
   */
  async create(data) {
    const { data: review, error } = await supabase
      .from("reviews")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return review;
  },

  /**
   * Get paginated reviews for a product + aggregate rating info
   */
  async findByProductId(productId, { page = 1, limit = 10 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: reviews, count, error } = await supabase
      .from("reviews")
      .select("id, rating, title, body, is_verified_purchase, helpful_count, created_at, buyer:users(id, full_name)", { count: "exact" })
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Compute aggregate rating distribution
    const { data: allRatings } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    for (const r of allRatings || []) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      totalRating += r.rating;
    }
    const totalCount = allRatings?.length || 0;
    const avgRating = totalCount > 0 ? Math.round((totalRating / totalCount) * 10) / 10 : 0;

    return {
      reviews: reviews || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      aggregate: { avgRating, totalCount, distribution },
    };
  },

  /**
   * Check if a buyer has already reviewed a product
   */
  async existsByBuyerAndProduct(buyerId, productId) {
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("product_id", productId)
      .single();
    return Boolean(data);
  },

  /**
   * Check if buyer has a delivered order containing this product
   */
  async buyerHasDeliveredOrder(buyerId, productId) {
    const { data } = await supabase
      .from("order_items")
      .select("id, order:orders!inner(buyer_id, status)")
      .eq("product_id", productId)
      .eq("order.buyer_id", buyerId)
      .eq("order.status", "delivered")
      .limit(1);

    return Boolean(data?.length);
  },

  /**
   * Delete own review
   */
  async delete(reviewId, buyerId) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("buyer_id", buyerId);

    if (error) throw error;
  },

  /**
   * Increment helpful count
   */
  async incrementHelpful(reviewId) {
    const { data, error } = await supabase.rpc("increment_helpful", { review_id: reviewId });
    if (error) {
      // Fallback if RPC not available
      const { data: review } = await supabase.from("reviews").select("helpful_count").eq("id", reviewId).single();
      await supabase.from("reviews").update({ helpful_count: (review?.helpful_count || 0) + 1 }).eq("id", reviewId);
    }
    return data;
  },
};

export default ReviewModel;
