import axios from "axios";

const authApiInstaaance = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

export default authApiInstaaance;

export async function register({ FullName, email, mobile, password, role }) {
  const response = await authApiInstaaance.post("/register", {
    FullName,
    email,
    mobile,
    password,
    role,
  });
  return response.data;
}

export async function LoginUser({ email, password }) {
  const response = await authApiInstaaance.post("/login", {
    email,
    password,
  });
  return response.data;
}

/**
 * Fetch current session user from httpOnly cookie.
 * Called once on app mount to rehydrate Redux auth state.
 */
export async function getMe() {
  const response = await authApiInstaaance.get("/me");
  return response.data;
}

/**
 * Initiates the Google OAuth flow.
 * Full page navigation — must follow the redirect chain.
 */
export function googleLogin() {
  window.location.href = "/api/auth/google";
}

/**
 * Called from RoleSelectPage — new Google users pick buyer/seller.
 * The pending token (purpose: google_pending_signup) + role create the account.
 */
export async function completeGoogleSignup({ token, role }) {
  const response = await authApiInstaaance.post("/google/complete", { token, role });
  return response.data;
}

/**
 * Called from LinkAccountPage — user with an existing email/password account
 * proves ownership with their password so Google can be safely linked.
 * Token purpose: google_account_link (distinct from signup token).
 */
export async function completeGoogleLink({ token, password }) {
  const response = await authApiInstaaance.post("/google/link", { token, password });
  return response.data;
}

