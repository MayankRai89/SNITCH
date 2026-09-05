import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controller/payment.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// ── Buyer Payment Routes ──────────────────────────────────────────────────────
router.post("/create-order", authenticate, authorize("buyer"), createRazorpayOrder);
router.post("/verify", authenticate, authorize("buyer"), verifyRazorpayPayment);

export default router;
