import supabase from "../config/supabaseClient.js";

const SellerModel = {
  /**
   * Create a new seller profile
   */
  async create(data) {
    const { data: seller, error } = await supabase
      .from("sellers")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return seller;
  },

  /**
   * Find seller profile by user UUID (non-deleted)
   */
  async findByUserId(userId) {
    const { data: seller, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return seller;
  },

  /**
   * Find public seller storefront by store_slug (verified, active, not deleted)
   */
  async findBySlug(storeSlug) {
    const { data: seller, error } = await supabase
      .from("sellers")
      .select("id, store_name, store_slug, business_type, bio, logo_url, banner_url, return_policy, verification_status, is_active, created_at")
      .eq("store_slug", storeSlug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return seller;
  },

  /**
   * Check if a store slug is already taken by another non-deleted seller
   */
  async isSlugTaken(storeSlug, excludeUserId = null) {
    let query = supabase
      .from("sellers")
      .select("id, user_id")
      .eq("store_slug", storeSlug)
      .is("deleted_at", null);

    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Boolean(data && data.length > 0);
  },

  /**
   * Update seller profile by user UUID
   */
  async updateByUserId(userId, fields) {
    const { data: seller, error } = await supabase
      .from("sellers")
      .update(fields)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;
    return seller;
  },

  /**
   * Soft delete seller profile
   */
  async softDelete(userId) {
    const { data: seller, error } = await supabase
      .from("sellers")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return seller;
  },

  // ── Seller Documents ────────────────────────────────────────────────────────

  /**
   * Add a compliance document for a seller
   */
  async addDocument(docData) {
    const { data: doc, error } = await supabase
      .from("seller_documents")
      .insert([docData])
      .select()
      .single();

    if (error) throw error;
    return doc;
  },

  /**
   * Get all uploaded documents for a seller
   */
  async getDocumentsBySellerId(sellerId) {
    const { data: docs, error } = await supabase
      .from("seller_documents")
      .select("*")
      .eq("seller_id", sellerId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return docs || [];
  },

  /**
   * Delete a seller document
   */
  async deleteDocument(docId, sellerId) {
    const { data, error } = await supabase
      .from("seller_documents")
      .delete()
      .eq("id", docId)
      .eq("seller_id", sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ── Verification History ────────────────────────────────────────────────────

  /**
   * Log a verification status change
   */
  async logVerificationTransition(historyData) {
    const { data, error } = await supabase
      .from("seller_verification_history")
      .insert([historyData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get verification history audit trail for a seller
   */
  async getVerificationHistory(sellerId) {
    const { data: history, error } = await supabase
      .from("seller_verification_history")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return history || [];
  },
};

export default SellerModel;
