import { Router } from "express";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  deleteSellerProfile,
  checkSlug,
  getPublicStorefront,
  uploadDocument,
  getDocuments,
  deleteDocument,
  getVerificationAuditHistory,
} from "../controller/seller.controller.js";
import {
  createSellerValidator,
  updateSellerValidator,
  uploadDocumentValidator,
} from "../validator/seller.validator.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Public: check if a slug is available (during onboarding wizard)
router.get("/check-slug/:slug", checkSlug);

// Public: view a verified seller's storefront
router.get("/storefront/:slug", getPublicStorefront);

// Protected: Seller's own profile endpoints
router.get("/me", authenticate, authorize("seller"), getMyProfile);
router.post("/", authenticate, authorize("seller"), createSellerValidator, createProfile);
router.put("/", authenticate, authorize("seller"), updateSellerValidator, updateProfile);
router.delete("/", authenticate, authorize("seller"), deleteSellerProfile);

// Protected: Seller compliance documents
router.get("/documents", authenticate, authorize("seller"), getDocuments);
router.post("/documents", authenticate, authorize("seller"), uploadDocumentValidator, uploadDocument);
router.delete("/documents/:id", authenticate, authorize("seller"), deleteDocument);

// Protected: Seller verification audit trail
router.get("/verification-history", authenticate, authorize("seller"), getVerificationAuditHistory);

export default router;
