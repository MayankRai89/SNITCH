import supabase from "../config/supabaseClient.js";

const ProductModel = {
  /**
   * Create a new product
   */
  async create(data) {
    const { data: product, error } = await supabase
      .from("products")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  /**
   * Find product by ID
   */
  async findById(id) {
    const { data: product, error } = await supabase
      .from("products")
      .select("*, seller:sellers(id, store_name, store_slug, logo_url, verification_status)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return product;
  },

  /**
   * Find product by unique slug or UUID
   */
  async findBySlug(slugOrId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    let query = supabase
      .from("products")
      .select("*, seller:sellers(id, store_name, store_slug, logo_url, verification_status)")
      .is("deleted_at", null);

    if (isUuid) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data: product, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return product;
  },

  /**
   * List all active public products for a seller's storefront page
   * Returns only fields needed for the public brand store
   */
  async findBySellerIdPublic(sellerId) {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, title, slug, category, tags, price, compare_at_price, cover_image_url, stock, sizes, colors, variants, is_active, created_at")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return products || [];
  },

  /**
   * List all products for a specific seller
   */
  async findBySellerId(sellerId) {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return products || [];
  },

  /**
   * Check if a product slug is already taken
   */
  async isSlugTaken(slug, excludeId = null) {
    let query = supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .is("deleted_at", null);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Boolean(data && data.length > 0);
  },

  /**
   * Update product by ID and seller ownership
   */
  async update(id, sellerId, fields) {
    const { data: product, error } = await supabase
      .from("products")
      .update(fields)
      .eq("id", id)
      .eq("seller_id", sellerId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  /**
   * Soft delete a product
   */
  async delete(id, sellerId) {
    const { data: product, error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id)
      .eq("seller_id", sellerId)
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  /**
   * Query public catalog with filters and pagination
   */
  async listPublic({ category, subcategory, gender, tag, minPrice, maxPrice, sort = "newest", search, page = 1, limit = 40 }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("products")
      .select("id, title, description, slug, category, price, compare_at_price, cover_image_url, tags, stock, sizes, colors, color_prices, variants, created_at, seller:sellers(store_name, store_slug)", { count: "exact" })
      .eq("is_active", true)
      .is("deleted_at", null);

    if (category && category !== "all") {
      query = query.eq("category", category.toLowerCase());
    }

    if (gender && gender !== "all") {
      query = query.or(`tags.cs.{"gender:${gender}"},tags.cs.{"${gender}"},tags.cs.{"gender:Unisex"},tags.cs.{"Unisex"}`);
    }

    if (subcategory && subcategory !== "all") {
      query = query.or(`tags.cs.{"sub:${subcategory}"},tags.cs.{"${subcategory}"}`);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (minPrice) {
      query = query.gte("price", parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte("price", parseFloat(maxPrice));
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
    }

    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(from, to);

    const { data: products, count, error } = await query;
    if (error) throw error;

    return {
      products: products || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },
};

export default ProductModel;
