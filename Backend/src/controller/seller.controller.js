import SellerModel from "../model/seller.model.js";
import ProductModel from "../model/product.model.js";


/**
 * GET /api/seller/profile/me
 * Retrieves current authenticated seller's full profile
 */
export async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found. Please complete onboarding.",
      });
    }

    return res.status(200).json({
      success: true,
      seller,
    });
  } catch (err) {
    console.error("[getMyProfile] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * POST /api/seller/profile
 * Create/onboard seller profile
 */
export async function createProfile(req, res) {
  try {
    const userId = req.user.id;

    // Check if seller profile already exists
    const existing = await SellerModel.findByUserId(userId);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Seller profile already exists for this account.",
      });
    }

    const {
      store_name,
      store_slug,
      onboarding_step = 1,
      business_type = "individual",
      contact_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country = "IN",
      tax_id,
      payout_method,
      payout_reference_id,
      payout_display_hint,
      bio,
      logo_url,
      banner_url,
      return_policy,
    } = req.body;

    // Check slug uniqueness
    const slugTaken = await SellerModel.isSlugTaken(store_slug);
    if (slugTaken) {
      return res.status(409).json({
        success: false,
        message: "Store URL slug is already taken. Please choose another.",
      });
    }

    // Explicitly construct allowed payload — NEVER trust client for verification_status, approved_by/at, or payout_verified
    const newSellerData = {
      user_id: userId,
      onboarding_step,
      store_name,
      store_slug: store_slug.toLowerCase(),
      business_type,
      contact_phone,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state,
      postal_code,
      country,
      tax_id: tax_id || null,
      verification_status: "pending",
      agreed_to_terms_at: new Date().toISOString(),
      payout_method: payout_method || null,
      payout_reference_id: payout_reference_id || null,
      payout_display_hint: payout_display_hint || null,
      payout_verified: false,
      bio: bio || null,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
      return_policy: return_policy || null,
      is_active: true,
    };

    const seller = await SellerModel.create(newSellerData);

    return res.status(201).json({
      success: true,
      message: "Seller profile created successfully.",
      seller,
    });
  } catch (err) {
    console.error("[createProfile] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * PUT /api/seller/profile
 * Update seller's own profile (whitelisted fields only)
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const existing = await SellerModel.findByUserId(userId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found.",
      });
    }

    const {
      store_name,
      store_slug,
      onboarding_step,
      is_active,
      business_type,
      contact_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      tax_id,
      bio,
      logo_url,
      banner_url,
      return_policy,
    } = req.body;

    const updates = {};

    if (store_name !== undefined) updates.store_name = store_name;
    if (onboarding_step !== undefined) updates.onboarding_step = onboarding_step;
    if (is_active !== undefined) updates.is_active = is_active;
    if (business_type !== undefined) updates.business_type = business_type;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone;
    if (address_line1 !== undefined) updates.address_line1 = address_line1;
    if (address_line2 !== undefined) updates.address_line2 = address_line2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (postal_code !== undefined) updates.postal_code = postal_code;
    if (tax_id !== undefined) updates.tax_id = tax_id;
    if (bio !== undefined) updates.bio = bio;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;
    if (return_policy !== undefined) updates.return_policy = return_policy;

    if (store_slug && store_slug.toLowerCase() !== existing.store_slug) {
      const slugTaken = await SellerModel.isSlugTaken(store_slug.toLowerCase(), userId);
      if (slugTaken) {
        return res.status(409).json({
          success: false,
          message: "Store URL slug is already taken.",
        });
      }
      updates.store_slug = store_slug.toLowerCase();
    }

    const updatedSeller = await SellerModel.updateByUserId(userId, updates);

    return res.status(200).json({
      success: true,
      message: "Seller profile updated successfully.",
      seller: updatedSeller,
    });
  } catch (err) {
    console.error("[updateProfile] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * DELETE /api/seller/profile
 * Soft-delete seller profile (preserves order and transaction history)
 */
export async function deleteSellerProfile(req, res) {
  try {
    const userId = req.user.id;
    await SellerModel.softDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Seller profile deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteSellerProfile] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/seller/check-slug/:slug
 * Real-time availability check for store slugs
 */
export async function checkSlug(req, res) {
  try {
    const { slug } = req.params;
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Invalid slug format. Use lowercase letters, numbers, and hyphens.",
      });
    }

    const userId = req.user?.id || null;
    const isTaken = await SellerModel.isSlugTaken(slug.toLowerCase(), userId);

    return res.status(200).json({
      success: true,
      available: !isTaken,
      slug: slug.toLowerCase(),
    });
  } catch (err) {
    console.error("[checkSlug] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/seller/storefront/:slug
 * Public storefront profile + products endpoint
 * Returns store info, all active products grouped metadata, and category list
 */
export async function getPublicStorefront(req, res) {
  try {
    const { slug } = req.params;
    const store = await SellerModel.findBySlug(slug);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or currently inactive.",
      });
    }

    // Fetch all active products for this store
    const products = await ProductModel.findBySellerIdPublic(store.id);

    // Derive unique categories from products (preserve insertion order, deduplicated)
    const categorySet = new Set();
    products.forEach((p) => {
      if (p.category) categorySet.add(p.category.toLowerCase());
    });
    const categories = Array.from(categorySet);

    // Compute totals
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    return res.status(200).json({
      success: true,
      store,
      products,
      categories,
      totalProducts: products.length,
      totalStock,
    });
  } catch (err) {
    console.error("[getPublicStorefront] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}


// ── Document Management ───────────────────────────────────────────────────────

/**
 * POST /api/seller/documents
 * Upload a compliance document record
 */
export async function uploadDocument(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found." });
    }

    const { doc_type, file_url, file_name } = req.body;

    const doc = await SellerModel.addDocument({
      seller_id: seller.id,
      doc_type,
      file_url,
      file_name: file_name || null,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document: doc,
    });
  } catch (err) {
    console.error("[uploadDocument] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/seller/documents
 * Get all uploaded documents for the seller
 */
export async function getDocuments(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found." });
    }

    const documents = await SellerModel.getDocumentsBySellerId(seller.id);

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (err) {
    console.error("[getDocuments] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * DELETE /api/seller/documents/:id
 * Delete a document
 */
export async function deleteDocument(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found." });
    }

    const { id } = req.params;
    await SellerModel.deleteDocument(id, seller.id);

    return res.status(200).json({
      success: true,
      message: "Document removed successfully.",
    });
  } catch (err) {
    console.error("[deleteDocument] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/seller/verification-history
 * Audit trail of verification status changes
 */
export async function getVerificationAuditHistory(req, res) {
  try {
    const userId = req.user.id;
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found." });
    }

    const history = await SellerModel.getVerificationHistory(seller.id);

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    console.error("[getVerificationAuditHistory] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
