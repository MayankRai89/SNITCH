import ReviewModel from "../model/review.model.js";

/**
 * POST /api/products/:productId/reviews
 * Buyer submits a review. Must have a delivered order containing this product.
 */
export async function createReview(req, res) {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;
    const { rating, title, body } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    // Prevent duplicate reviews
    const alreadyReviewed = await ReviewModel.existsByBuyerAndProduct(buyerId, productId);
    if (alreadyReviewed) {
      return res.status(409).json({ success: false, message: "You have already reviewed this product." });
    }

    // Check verified purchase
    const isVerified = await ReviewModel.buyerHasDeliveredOrder(buyerId, productId);
    // Note: We allow unverified reviews too, just mark them as unverified

    const review = await ReviewModel.create({
      product_id: productId,
      buyer_id: buyerId,
      rating: parseInt(rating),
      title: title?.trim() || null,
      body: body?.trim() || null,
      is_verified_purchase: isVerified,
    });

    return res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("[createReview] error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "You have already reviewed this product." });
    }
    return res.status(500).json({ success: false, message: "Failed to submit review." });
  }
}

/**
 * GET /api/products/:productId/reviews
 * Public: paginated reviews + aggregate rating
 */
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const result = await ReviewModel.findByProductId(productId, { page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[getProductReviews] error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews." });
  }
}

/**
 * DELETE /api/reviews/:id
 * Buyer deletes their own review
 */
export async function deleteReview(req, res) {
  try {
    const buyerId = req.user.id;
    await ReviewModel.delete(req.params.id, buyerId);
    return res.status(200).json({ success: true, message: "Review deleted." });
  } catch (err) {
    console.error("[deleteReview] error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete review." });
  }
}

/**
 * PUT /api/reviews/:id/helpful
 * Mark a review as helpful (rate-limited by IP in middleware)
 */
export async function markHelpful(req, res) {
  try {
    await ReviewModel.incrementHelpful(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[markHelpful] error:", err);
    return res.status(500).json({ success: false, message: "Failed to mark review." });
  }
}
