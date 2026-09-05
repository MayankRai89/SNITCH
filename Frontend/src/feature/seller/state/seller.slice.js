import { createSlice } from "@reduxjs/toolkit";

const sellerSlice = createSlice({
  name: "seller",
  initialState: {
    profile: null,       // seller profile object from /api/seller/me
    isOnboarded: false,  // true once a profile exists
    isLoading: false,
    error: null,
  },
  reducers: {
    setSellerProfile: (state, action) => {
      state.profile = action.payload;
      state.isOnboarded = !!action.payload;
      state.isLoading = false;
      state.error = null;
    },
    clearSellerProfile: (state) => {
      state.profile = null;
      state.isOnboarded = false;
    },
    setSellerLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSellerError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearSellerError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSellerProfile,
  clearSellerProfile,
  setSellerLoading,
  setSellerError,
  clearSellerError,
} = sellerSlice.actions;

export const sellerReducer = sellerSlice.reducer;
