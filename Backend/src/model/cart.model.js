import supabase from "../config/supabaseClient.js";

const CartModel = {
  /**
   * Fetch all cart items for a user with joined product & seller information
   */
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        user_id,
        product_id,
        selected_size,
        selected_color,
        quantity,
        created_at,
        updated_at,
        product:products (
          id,
          title,
          slug,
          price,
          compare_at_price,
          images,
          stock,
          is_active,
          seller:sellers (
            store_name
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add an item to the cart or increment quantity if it already exists
   */
  async addItem({ userId, productId, selectedSize = "M", selectedColor = "Standard", quantity = 1 }) {
    // Check if item already exists in cart for this user & variant
    const { data: existing, error: findError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("selected_size", selectedSize)
      .eq("selected_color", selectedColor)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      const { data, error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existing.id)
        .select(`
          id,
          user_id,
          product_id,
          selected_size,
          selected_color,
          quantity,
          created_at,
          updated_at,
          product:products (
            id,
            title,
            slug,
            price,
            compare_at_price,
            images,
            stock,
            is_active,
            seller:sellers (
              store_name
            )
          )
        `)
        .single();

      if (updateError) throw updateError;
      return data;
    }

    // Insert new cart item
    const { data, error } = await supabase
      .from("cart_items")
      .insert([
        {
          user_id: userId,
          product_id: productId,
          selected_size: selectedSize,
          selected_color: selectedColor,
          quantity,
        },
      ])
      .select(`
        id,
        user_id,
        product_id,
        selected_size,
        selected_color,
        quantity,
        created_at,
        updated_at,
        product:products (
          id,
          title,
          slug,
          price,
          compare_at_price,
          images,
          stock,
          is_active,
          seller:sellers (
            store_name
          )
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update quantity of a specific cart item
   */
  async updateQuantity({ id, userId, quantity }) {
    if (quantity <= 0) {
      return this.removeItem({ id, userId });
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .eq("user_id", userId)
      .select(`
        id,
        user_id,
        product_id,
        selected_size,
        selected_color,
        quantity,
        created_at,
        updated_at,
        product:products (
          id,
          title,
          slug,
          price,
          compare_at_price,
          images,
          stock,
          is_active,
          seller:sellers (
            store_name
          )
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a specific cart item
   */
  async removeItem({ id, userId }) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Clear all cart items for a user
   */
  async clearCart(userId) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  },

  /**
   * Bulk merge guest items into user's database cart upon login
   */
  async syncCart({ userId, items }) {
    if (!items || !items.length) return this.findByUserId(userId);

    for (const item of items) {
      if (!item.productId && !item.product_id) continue;
      const productId = item.productId || item.product_id;
      const selectedSize = item.selectedSize || item.selected_size || "M";
      const selectedColor = item.selectedColor || item.selected_color || "Standard";
      const quantity = item.quantity || 1;

      await this.addItem({
        userId,
        productId,
        selectedSize,
        selectedColor,
        quantity,
      });
    }

    return this.findByUserId(userId);
  },
};

export default CartModel;
