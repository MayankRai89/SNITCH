import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartService } from "../services/cart.service";

const CART_STORAGE_KEY = "snitch_shopping_bag_v1";

const loadSavedCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
};

// ── Async Thunks for Server Sync & Pricing ────────────────────────────────────

export const fetchCartSummary = createAsyncThunk(
  "cart/fetchCartSummary",
  async ({ items, couponCode }, { rejectWithValue }) => {
    try {
      return await cartService.getSummary(items, couponCode);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    return await cartService.getCart();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const syncCart = createAsyncThunk("cart/syncCart", async (localItems, { rejectWithValue }) => {
  try {
    return await cartService.syncCart(localItems);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addToCartServer = createAsyncThunk(
  "cart/addToCartServer",
  async (itemData, { rejectWithValue }) => {
    try {
      return await cartService.addItem(itemData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateQuantityServer = createAsyncThunk(
  "cart/updateQuantityServer",
  async ({ id, quantity }, { rejectWithValue }) => {
    try {
      return await cartService.updateQuantity(id, quantity);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeFromCartServer = createAsyncThunk(
  "cart/removeFromCartServer",
  async (id, { rejectWithValue }) => {
    try {
      await cartService.removeItem(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const clearCartServer = createAsyncThunk(
  "cart/clearCartServer",
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadSavedCart(),
    isOpen: false,
    couponCode: "",
    discountRate: 0,
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload || [];
      saveCart(state.items);
    },

    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedSize === newItem.selectedSize &&
          item.selectedColor === newItem.selectedColor
      );

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += newItem.quantity || 1;
      } else {
        state.items.unshift({
          id: newItem.id || `${newItem.productId}-${newItem.selectedSize}-${newItem.selectedColor || "default"}-${Date.now()}`,
          productId: newItem.productId,
          title: newItem.title,
          slug: newItem.slug,
          coverImage: newItem.coverImage,
          price: Number(newItem.price),
          compareAtPrice: newItem.compareAtPrice ? Number(newItem.compareAtPrice) : null,
          selectedSize: newItem.selectedSize || "M",
          selectedColor: newItem.selectedColor || "Standard",
          quantity: newItem.quantity || 1,
          sellerName: newItem.sellerName || "SNITCH Exclusive",
          maxStock: newItem.stock || 99,
        });
      }

      state.isOpen = true; // Auto-open bag drawer on addition
      saveCart(state.items);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCart(state.items);
    },

    updateQuantity: (state, action) => {
      const { id, delta } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          state.items = state.items.filter((i) => i.id !== id);
        } else {
          item.quantity = Math.min(newQty, item.maxStock || 99);
        }
        saveCart(state.items);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.summary = null;
      saveCart(state.items);
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    applyCoupon: (state, action) => {
      const code = (action.payload || "").trim().toUpperCase();
      state.couponCode = code;
    },

    removeCoupon: (state) => {
      state.couponCode = "";
      state.discountRate = 0;
      if (state.summary) {
        state.summary.couponCode = "";
        state.summary.discountAmount = 0;
        state.summary.isCouponValid = false;
        state.summary.finalTotal = Math.max(0, (state.summary.subtotal || 0) + (state.summary.shipping || 0));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Summary
      .addCase(fetchCartSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        if (action.payload?.couponCode) {
          state.couponCode = action.payload.couponCode;
          state.discountRate = action.payload.discountRate || 0;
        }
      })

      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.items = action.payload;
          saveCart(state.items);
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync Cart
      .addCase(syncCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
          saveCart(state.items);
        }
      })

      // Clear Cart Server
      .addCase(clearCartServer.fulfilled, (state) => {
        state.items = [];
        state.summary = null;
        saveCart(state.items);
      });
  },
});

export const {
  setCartItems,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  applyCoupon,
  removeCoupon,
} = cartSlice.actions;

export const cartReducer = cartSlice.reducer;
