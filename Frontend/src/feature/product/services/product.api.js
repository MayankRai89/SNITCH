import axios from "axios";

const productApiClient = axios.create({
  baseURL: "/api/products",
  withCredentials: true,
});

/**
 * Fetch public catalog with optional filters
 */
export async function getPublicCatalog(params = {}) {
  const response = await productApiClient.get("/", { params });
  return response.data;
}

/**
 * Fetch single product details by slug
 */
export async function getProductBySlug(slug) {
  const response = await productApiClient.get(`/item/${encodeURIComponent(slug)}`);
  return response.data;
}

/**
 * Seller: fetch own products
 */
export async function getSellerProducts() {
  const response = await productApiClient.get("/seller/me");
  return response.data;
}

/**
 * Seller: fetch single product by ID for editing
 */
export async function getSellerProductById(id) {
  const response = await productApiClient.get(`/seller/item/${id}`);
  return response.data;
}

/**
 * Seller: create a new product with FormData (images + details)
 */
export async function createProduct(formData) {
  const response = await productApiClient.post("/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Seller: update product
 */
export async function updateProduct(id, formDataOrJson) {
  const headers = formDataOrJson instanceof FormData
    ? { "Content-Type": "multipart/form-data" }
    : { "Content-Type": "application/json" };

  const response = await productApiClient.put(`/${id}`, formDataOrJson, { headers });
  return response.data;
}

/**
 * Seller: delete product
 */
export async function deleteProduct(id) {
  const response = await productApiClient.delete(`/${id}`);
  return response.data;
}

export default productApiClient;
