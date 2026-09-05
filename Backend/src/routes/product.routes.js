import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  getSellerProductById,
  updateProduct,
  deleteProduct,
  getPublicCatalog,
  getProductBySlug,
} from "../controller/product.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { handleProductUpload } from "../middleware/upload.middleware.js";

const router = Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get("/", getPublicCatalog);
router.get("/item/:slug", getProductBySlug);

// ── Seller Protected Routes ───────────────────────────────────────────────────
router.get("/seller/me", authenticate, authorize("seller"), getMyProducts);
router.get("/seller/item/:id", authenticate, authorize("seller"), getSellerProductById);
router.post("/", authenticate, authorize("seller"), handleProductUpload, createProduct);
router.put("/:id", authenticate, authorize("seller"), handleProductUpload, updateProduct);
router.delete("/:id", authenticate, authorize("seller"), deleteProduct);

export default router;