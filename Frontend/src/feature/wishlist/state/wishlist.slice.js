import { createSlice } from "@reduxjs/toolkit";

const WISHLIST_STORAGE_KEY = "snitch_wishlist_v1";

const loadSavedWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (items) => {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save wishlist to localStorage", e);
  }
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: loadSavedWishlist(),
    isOpen: false,
  },
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const index = state.items.findIndex(
        (item) => item.productId === (product.id || product.productId)
      );

      if (index > -1) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift({
          productId: product.id || product.productId,
          title: product.title,
          slug: product.slug,
          coverImage: product.cover_image_url || product.coverImage,
          price: Number(product.price),
          compareAtPrice: product.compare_at_price || product.compareAtPrice ? Number(product.compare_at_price || product.compareAtPrice) : null,
          sellerName: product.seller?.store_name || product.sellerName || "SNITCH Store",
          category: product.category,
          stock: product.stock,
          sizes: product.sizes || [],
          colors: product.colors || [],
          tags: product.tags || [],
          addedAt: new Date().toISOString(),
        });
      }

      saveWishlist(state.items);
    },

    addToWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.items.some(
        (item) => item.productId === (product.id || product.productId)
      );

      if (!exists) {
        state.items.unshift({
          productId: product.id || product.productId,
          title: product.title,
          slug: product.slug,
          coverImage: product.cover_image_url || product.coverImage,
          price: Number(product.price),
          compareAtPrice: product.compare_at_price || product.compareAtPrice ? Number(product.compare_at_price || product.compareAtPrice) : null,
          sellerName: product.seller?.store_name || product.sellerName || "SNITCH Store",
          category: product.category,
          stock: product.stock,
          sizes: product.sizes || [],
          colors: product.colors || [],
          tags: product.tags || [],
          addedAt: new Date().toISOString(),
        });
        saveWishlist(state.items);
      }
    },

    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item.productId !== productId);
      saveWishlist(state.items);
    },

    clearWishlist: (state) => {
      state.items = [];
      saveWishlist(state.items);
    },

    openWishlist: (state) => {
      state.isOpen = true;
    },

    closeWishlist: (state) => {
      state.isOpen = false;
    },

    toggleWishlistDrawer: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const {
  toggleWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  openWishlist,
  closeWishlist,
  toggleWishlistDrawer,
} = wishlistSlice.actions;

export const wishlistReducer = wishlistSlice.reducer;
