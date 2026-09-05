import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
} from "../controller/order.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// ── Buyer Routes ───────────────────────────────────────────────────────────────
router.post("/", authenticate, authorize("buyer"), createOrder);
router.get("/me", authenticate, authorize("buyer"), getMyOrders);
router.get("/:id", authenticate, authorize("buyer"), getOrderById);
router.put("/:id/cancel", authenticate, authorize("buyer"), cancelOrder);

// ── Seller Routes ──────────────────────────────────────────────────────────────
router.get("/seller/me", authenticate, authorize("seller"), getSellerOrders);
router.put("/:id/status", authenticate, authorize("seller"), updateOrderStatus);

export default router;
