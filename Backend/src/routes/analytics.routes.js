import { Router } from "express";
import { getAnalyticsSummary, getProductAnalytics, trackEvent } from "../controller/analytics.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Public event tracking (rate limited via express-rate-limit in app.js)
router.post("/event", trackEvent);

// Seller-only analytics
router.get("/summary", authenticate, authorize("seller"), getAnalyticsSummary);
router.get("/products", authenticate, authorize("seller"), getProductAnalytics);

export default router;
