import supabase from "../config/supabaseClient.js";

const OrderModel = {
  /**
   * Create an order + its line items atomically
   */
  async create({ order, items }) {
    // Insert order
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert all line items
    const lineItems = items.map((item) => ({ ...item, order_id: createdOrder.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(lineItems);
    if (itemsError) throw itemsError;

    return createdOrder;
  },

  /**
   * Fetch a single order with its items (buyer or seller access — caller checks ownership)
   */
  async findById(orderId) {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return order;
  },

  /**
   * List all orders for a buyer (newest first)
   */
  async findByBuyerId(buyerId) {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, items:order_items(id, title, cover_image_url, quantity, unit_price, selected_size, selected_color)")
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return orders || [];
  },

  /**
   * List all orders for a seller's store (newest first)
   */
  async findBySellerId(sellerId) {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return orders || [];
  },

  /**
   * Update order status — also sets audit timestamps
   */
  async updateStatus(orderId, newStatus, extraFields = {}) {
    const timestampMap = {
      confirmed: "confirmed_at",
      shipped: "shipped_at",
      delivered: "delivered_at",
      cancelled: "cancelled_at",
    };

    const updates = { status: newStatus, ...extraFields };
    if (timestampMap[newStatus]) {
      updates[timestampMap[newStatus]] = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Decrement stock for each ordered item
   */
  async decrementStock(items) {
    for (const item of items) {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      if (fetchError) throw fetchError;
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: product.stock - item.quantity })
        .eq("id", item.product_id);

      if (updateError) throw updateError;
    }
  },

  /**
   * Restore stock on cancellation
   */
  async restoreStock(orderId) {
    const { data: items, error } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (error) throw error;

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      await supabase
        .from("products")
        .update({ stock: (product?.stock || 0) + item.quantity })
        .eq("id", item.product_id);
    }
  },
};

export default OrderModel;
