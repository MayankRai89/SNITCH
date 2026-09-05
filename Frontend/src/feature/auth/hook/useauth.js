import { useNavigate } from "react-router";
import {
  setLoading,
  setError,
  login,
  clearError,
} from "../state/auth.slice";
import { useSelector, useDispatch } from "react-redux";
import { LoginUser, register } from "../services/auth.api";

// ── Get current auth state ────────────────────────────────────────────────────
export const useAuth = () => {
  return useSelector((state) => state.auth);
};

// ── Login + role-based redirect ───────────────────────────────────────────────
export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    dispatch(setLoading({ isLoading: true }));
    dispatch(clearError());
    try {
      const response = await LoginUser({ email, password });

      if (response.success) {
        // Save user to Redux store (token is in httpOnly cookie)
        dispatch(login({ user: response.user, token: null }));
        // Redirect based on role: buyer → /homepage, seller → /seller/dashboard
        navigate(response.redirect);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || "Login failed. Please try again.";
      dispatch(setError({ error: message }));
    }
  };

  return handleLogin;
};

// ── Register ──────────────────────────────────────────────────────────────────
export const useRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async ({ email, mobile, password, FullName, role }) => {
    dispatch(setLoading({ isLoading: true }));
    dispatch(clearError());
    try {
      const response = await register({ email, mobile, password, FullName, role });

      if (response.success) {
        dispatch(login({ user: response.user, token: null }));
        // seller → /seller/dashboard, buyer → /homepage
        navigate(response.redirect);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || "Registration failed. Please try again.";
      dispatch(setError({ error: message }));
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  };

  return handleRegister;
};
