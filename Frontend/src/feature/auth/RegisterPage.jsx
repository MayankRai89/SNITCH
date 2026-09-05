import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { register, googleLogin } from "./services/auth.api";
import { login } from "./state/auth.slice";

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    password: "",
    isSeller: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError("");
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await register({
        FullName: form.fullName,
        email: form.email,
        mobile: form.contactNumber,
        password: form.password,
        role: form.isSeller ? "seller" : "buyer",
      });
      if (data.user) {
        dispatch(login({ user: data.user, token: null }));
      }
      // Use role-based redirect returned by backend
      // seller → /seller/dashboard, buyer → /homepage
      navigate(data.redirect ?? "/homepage", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message ?? "Something went wrong. Please try again.";

      if (status === 409) {
        navigate("/login", { state: { notice: message } });
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#111111" }}
    >
      <main className="w-full max-w-[440px]">
        {/* Brand */}
        <header className="mb-10 text-center">
          <h1
            className="text-4xl font-extrabold tracking-tighter"
            style={{ color: "#f5c518", letterSpacing: "-0.03em" }}
          >
            SNITCH
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#9a9078" }}>
            Create your account
          </p>
        </header>

        {/* Card */}
        <div
          className="rounded-lg p-10 flex flex-col gap-6"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="rounded px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: "rgba(220,38,38,0.12)",
                border: "1px solid rgba(220,38,38,0.35)",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9a9078" }}
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                required
                value={form.fullName}
                onChange={handleChange}
                className="snitch-input"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9a9078" }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={handleChange}
                className="snitch-input"
              />
            </div>

            {/* Contact Number */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="contactNumber"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9a9078" }}
              >
                Contact Number
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                required
                value={form.contactNumber}
                onChange={handleChange}
                className="snitch-input"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#9a9078" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars, A-Z, a-z, 0-9, @$!%*?&"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="snitch-input"
                  style={{ paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded transition-colors"
                  style={{ color: "#9a9078", background: "transparent", border: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "#4e4633" }}>
                Must be 8+ chars with uppercase, lowercase, number &amp; special character (@$!%*?&amp;)
              </p>
            </div>

            {/* Is Seller */}
            <div className="flex items-center gap-3 pt-1">
              <input
                id="isSeller"
                name="isSeller"
                type="checkbox"
                checked={form.isSeller}
                onChange={handleChange}
                className="snitch-checkbox"
              />
              <label
                htmlFor="isSeller"
                className="text-sm cursor-pointer select-none"
                style={{ color: "#d1c5ac" }}
              >
                Register as a Seller
              </label>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded text-sm font-bold uppercase tracking-widest mt-2 transition-opacity"
              style={{
                backgroundColor: "#f5c518",
                color: "#111111",
                letterSpacing: "0.1em",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.65 : 1,
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.opacity = "1")}
            >
              {isLoading ? "Registering…" : "Register"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#2a2a2a" }} />
            <span style={{ fontSize: "11px", color: "#5a5a5a", letterSpacing: "0.08em" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#2a2a2a" }} />
          </div>

          {/* Google OAuth Button */}
          <button
            id="google-register"
            type="button"
            onClick={googleLogin}
            className="w-full py-3 rounded text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #333",
              color: "#e0e0e0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252525";
              e.currentTarget.style.borderColor = "#444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1e1e1e";
              e.currentTarget.style.borderColor = "#333";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Sign in link */}
        <p
          className="text-center mt-8 text-sm"
          style={{ color: "#9a9078" }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="transition-colors"
            style={{ color: "#f5c518" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
