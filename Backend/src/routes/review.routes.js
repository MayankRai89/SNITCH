import { Router } from "express";
import { createReview, getProductReviews, deleteReview, markHelpful } from "../controller/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

// Public: get reviews for a product
router.get("/", getProductReviews);

// Buyer only: submit a review
router.post("/", authenticate, authorize("buyer"), createReview);

// Buyer only: delete own review
router.delete("/:reviewId", authenticate, authorize("buyer"), deleteReview);

// Public with rate limiting: mark review helpful
router.put("/:reviewId/helpful", markHelpful);

export default router;
