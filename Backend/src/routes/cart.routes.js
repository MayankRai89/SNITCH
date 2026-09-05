import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  syncCart,
  calculateSummary,
} from "../controller/cart.controller.js";

const router = Router();

// Public calculation endpoint (works for both guests & logged-in users)
router.post("/summary", calculateSummary);

// All subsequent cart management endpoints require authentication
router.use(authenticate);

// GET /api/cart - Get user's cart
router.get("/", getCart);

// POST /api/cart/items - Add item to cart
router.post("/items", addItem);

// PATCH /api/cart/items/:id - Update item quantity
router.patch("/items/:id", updateQuantity);

// DELETE /api/cart/items/:id - Remove item from cart
router.delete("/items/:id", removeItem);

// DELETE /api/cart - Clear whole cart
router.delete("/", clearCart);

// POST /api/cart/sync - Sync local cart items into database
router.post("/sync", syncCart);

export default router;
