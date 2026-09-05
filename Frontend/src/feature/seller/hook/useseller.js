import { useDispatch, useSelector } from "react-redux";
import {
  setSellerProfile,
  setSellerLoading,
  setSellerError,
  clearSellerError,
} from "../state/seller.slice";
import {
  getMySellerProfile,
  createSellerProfile,
  updateSellerProfile,
  checkStoreSlugAvailability,
} from "../services/seller.api";

// ── Read seller state ──────────────────────────────────────────────────────────
export const useSeller = () => useSelector((state) => state.seller);

// ── Fetch my seller profile (run on dashboard mount) ──────────────────────────
export const useGetSellerProfile = () => {
  const dispatch = useDispatch();

  return async () => {
    dispatch(setSellerLoading(true));
    dispatch(clearSellerError());
    try {
      const response = await getMySellerProfile();
      dispatch(setSellerProfile(response.seller ?? null));
      return response.seller;
    } catch (err) {
      // 404 means no profile yet — that's not an error, it's an expected state
      if (err?.response?.status === 404) {
        dispatch(setSellerProfile(null));
        return null;
      }
      const message = err?.response?.data?.message || "Failed to fetch seller profile.";
      dispatch(setSellerError(message));
      throw err;
    }
  };
};

// ── Create seller profile (onboarding) ────────────────────────────────────────
export const useCreateSellerProfile = () => {
  const dispatch = useDispatch();

  return async (profileData) => {
    dispatch(setSellerLoading(true));
    dispatch(clearSellerError());
    try {
      const response = await createSellerProfile(profileData);
      dispatch(setSellerProfile(response.seller));
      return response.seller;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create seller profile.";
      dispatch(setSellerError(message));
      throw err;
    }
  };
};

// ── Update seller profile ──────────────────────────────────────────────────────
export const useUpdateSellerProfile = () => {
  const dispatch = useDispatch();

  return async (updates) => {
    dispatch(setSellerLoading(true));
    dispatch(clearSellerError());
    try {
      const response = await updateSellerProfile(updates);
      dispatch(setSellerProfile(response.seller));
      return response.seller;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update seller profile.";
      dispatch(setSellerError(message));
      throw err;
    }
  };
};

// ── Check store slug availability (debounced in component) ────────────────────
export const useCheckSlug = () => {
  return async (slug) => {
    try {
      const response = await checkStoreSlugAvailability(slug);
      return response.available;
    } catch {
      return false;
    }
  };
};
