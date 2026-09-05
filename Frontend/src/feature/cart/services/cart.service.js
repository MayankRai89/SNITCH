/**
 * Cart API Service for backend synchronization & server-side price calculation
 */

export const cartService = {
  async getCart() {
    const res = await fetch("/api/cart", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch cart");
    const data = await res.json();
    return data.items || [];
  },

  async getSummary(items, couponCode = "") {
    const res = await fetch("/api/cart/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items, couponCode }),
    });
    if (!res.ok) throw new Error("Failed to calculate cart summary");
    const data = await res.json();
    return data.summary;
  },

  async addItem({ productId, selectedSize, selectedColor, quantity }) {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        productId,
        selectedSize,
        selectedColor,
        quantity,
      }),
    });
    if (!res.ok) throw new Error("Failed to add item to cart");
    return await res.json();
  },

  async updateQuantity(id, quantity) {
    const res = await fetch(`/api/cart/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error("Failed to update cart quantity");
    return await res.json();
  },

  async removeItem(id) {
    const res = await fetch(`/api/cart/items/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove cart item");
    return await res.json();
  },

  async clearCart() {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to clear cart");
    return await res.json();
  },

  async syncCart(items) {
    const res = await fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error("Failed to sync cart");
    const data = await res.json();
    return data.items || [];
  },
};
