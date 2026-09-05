import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuth: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuth = true;
      state.isLoading = false;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
    },
    setToken: (state, action) => {
      state.token = action.payload.token;
    },
    setIsAuth: (state, action) => {
      state.isAuth = action.payload.isAuth;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload.isLoading;
    },
    setError: (state, action) => {
      state.error = action.payload.error;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuth = false;
      state.isLoading = false;
    },
  },
});

export const {
  login,
  logout,
  setUser,
  setToken,
  setIsAuth,
  setLoading,
  setError,
  clearError,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
