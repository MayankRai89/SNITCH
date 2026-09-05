import axios from "axios";

const sellerApiClient = axios.create({
  baseURL: "/api/seller",
  withCredentials: true,
});

export async function getMySellerProfile() {
  const response = await sellerApiClient.get("/me");
  return response.data;
}

export async function createSellerProfile(sellerData) {
  const response = await sellerApiClient.post("/", sellerData);
  return response.data;
}

export async function updateSellerProfile(updates) {
  const response = await sellerApiClient.put("/", updates);
  return response.data;
}

export async function deleteSellerProfile() {
  const response = await sellerApiClient.delete("/");
  return response.data;
}

export async function checkStoreSlugAvailability(slug) {
  const response = await sellerApiClient.get(`/check-slug/${encodeURIComponent(slug)}`);
  return response.data;
}

export async function getPublicStorefront(slug) {
  const response = await sellerApiClient.get(`/storefront/${encodeURIComponent(slug)}`);
  return response.data;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getSellerDocuments() {
  const response = await sellerApiClient.get("/documents");
  return response.data;
}

export async function uploadSellerDocument({ doc_type, file_url, file_name }) {
  const response = await sellerApiClient.post("/documents", { doc_type, file_url, file_name });
  return response.data;
}

export async function deleteSellerDocument(docId) {
  const response = await sellerApiClient.delete(`/documents/${docId}`);
  return response.data;
}

// ── Verification Audit ────────────────────────────────────────────────────────

export async function getSellerVerificationHistory() {
  const response = await sellerApiClient.get("/verification-history");
  return response.data;
}

export default sellerApiClient;
