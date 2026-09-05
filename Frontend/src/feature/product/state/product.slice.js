import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
  name: "product",
  initialState: {
    products: [],
    sellerProducts: [],
    currentProduct: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setSellerProducts: (state, action) => {
      state.sellerProducts = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    addProduct: (state, action) => {
      state.sellerProducts.unshift(action.payload);
    },
    removeProduct: (state, action) => {
      state.sellerProducts = state.sellerProducts.filter(
        (p) => p.id !== action.payload
      );
    },
    setProductLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setProductError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setProducts,
  setSellerProducts,
  setCurrentProduct,
  addProduct,
  removeProduct,
  setProductLoading,
  setProductError,
  clearProductError,
} = productSlice.actions;

export const productReducer = productSlice.reducer;
