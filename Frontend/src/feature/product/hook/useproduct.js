import { useDispatch, useSelector } from "react-redux";
import {
  addProduct,
  setProducts,
  setSellerProducts,
  setProductLoading,
  setProductError,
  clearProductError,
} from "../state/product.slice";
import { createProduct, getSellerProducts, getPublicCatalog } from "../services/product.api";

// ── Get product state ──────────────────────────────────────────────────────────
export const useProduct = () => {
  return useSelector((state) => state.product);
};

// ── Create product ─────────────────────────────────────────────────────────────
export const useCreateProduct = () => {
  const dispatch = useDispatch();

  const create = async (formData) => {
    dispatch(setProductLoading(true));
    dispatch(clearProductError());
    try {
      const response = await createProduct(formData);
      if (response.product) {
        dispatch(addProduct(response.product));
      }
      return response;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to create product.";
      dispatch(setProductError(message));
      throw err;
    } finally {
      dispatch(setProductLoading(false));
    }
  };

  return create;
};

// ── Get seller products ────────────────────────────────────────────────────────
export const useGetSellerProducts = () => {
  const dispatch = useDispatch();

  const get = async () => {
    dispatch(setProductLoading(true));
    try {
      const response = await getSellerProducts();
      dispatch(setSellerProducts(response.products ?? []));
      return response;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to fetch products.";
      dispatch(setProductError(message));
      throw err;
    } finally {
      dispatch(setProductLoading(false));
    }
  };

  return get;
};

// ── Get public catalog products ────────────────────────────────────────────────
export const useGetPublicCatalog = () => {
  const dispatch = useDispatch();

  const get = async (params = {}) => {
    dispatch(setProductLoading(true));
    try {
      const response = await getPublicCatalog(params);
      dispatch(setProducts(response.products ?? []));
      return response;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to fetch catalog.";
      dispatch(setProductError(message));
      throw err;
    } finally {
      dispatch(setProductLoading(false));
    }
  };

  return get;
};
