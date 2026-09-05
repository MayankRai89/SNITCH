import { body, validationResult } from "express-validator";

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
}

export const createSellerValidator = [
  body("store_name")
    .trim()
    .notEmpty()
    .withMessage("Store name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Store name must be between 2 and 100 characters"),

  body("store_slug")
    .trim()
    .notEmpty()
    .withMessage("Store slug is required")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Store slug must only contain lowercase letters, numbers, and hyphens (e.g. urban-threads)"),

  body("onboarding_step")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Onboarding step must be an integer between 1 and 5"),

  body("business_type")
    .optional()
    .isIn(["individual", "business"])
    .withMessage("Business type must be either 'individual' or 'business'"),

  body("contact_phone")
    .trim()
    .notEmpty()
    .withMessage("Contact phone is required"),

  body("address_line1")
    .trim()
    .notEmpty()
    .withMessage("Address line 1 is required"),

  body("address_line2")
    .optional()
    .trim(),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("postal_code")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required"),

  body("country")
    .optional()
    .trim(),

  body("tax_id")
    .optional()
    .trim(),

  body("payout_method")
    .optional()
    .isIn(["bank", "upi"])
    .withMessage("Payout method must be 'bank' or 'upi'"),

  body("payout_reference_id")
    .optional()
    .trim(),

  body("payout_display_hint")
    .optional()
    .trim(),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  body("logo_url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("banner_url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Banner URL must be a valid URL"),

  body("return_policy")
    .optional()
    .trim(),

  validateRequest,
];

export const updateSellerValidator = [
  body("store_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Store name must be between 2 and 100 characters"),

  body("store_slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Store slug must only contain lowercase letters, numbers, and hyphens"),

  body("onboarding_step")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Onboarding step must be an integer between 1 and 5"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean value"),

  body("business_type")
    .optional()
    .isIn(["individual", "business"])
    .withMessage("Business type must be either 'individual' or 'business'"),

  body("contact_phone")
    .optional()
    .trim(),

  body("address_line1")
    .optional()
    .trim(),

  body("address_line2")
    .optional()
    .trim(),

  body("city")
    .optional()
    .trim(),

  body("state")
    .optional()
    .trim(),

  body("postal_code")
    .optional()
    .trim(),

  body("tax_id")
    .optional()
    .trim(),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  body("logo_url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo URL must be a valid URL"),

  body("banner_url")
    .optional()
    .trim()
    .isURL()
    .withMessage("Banner URL must be a valid URL"),

  body("return_policy")
    .optional()
    .trim(),

  validateRequest,
];

export const uploadDocumentValidator = [
  body("doc_type")
    .trim()
    .notEmpty()
    .withMessage("Document type is required")
    .isIn(["id_proof", "business_registration", "tax_certificate", "cancelled_cheque", "other"])
    .withMessage("Invalid document type"),

  body("file_url")
    .trim()
    .notEmpty()
    .withMessage("File URL is required"),

  body("file_name")
    .optional()
    .trim(),

  validateRequest,
];
