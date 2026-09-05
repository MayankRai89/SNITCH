import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { completeGoogleLink } from "./services/auth.api";

export default function LinkAccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Decode token payload to show the user which email we're linking to
  const emailFromToken = (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).email ?? "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    if (!token) setTokenExpired(true);
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const data = await completeGoogleLink({ token, password });
      if (data.success) {
        navigate(data.redirect ?? "/homepage", { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Something went wrong.";
      if (msg.toLowerCase().includes("expired")) {
        setTokenExpired(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const ROOT = {
    minHeight: "100vh",
    backgroundColor: "#111111",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Geist', sans-serif",
  };

  const CARD = {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#161616",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "40px 36px",
  };

  const INPUT = {
    width: "100%",
    padding: "12px 14px",
    backgroundColor: "#0e0e0e",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    caretColor: "#f5c518",
  };

  const BTN = {
    width: "100%",
    padding: "13px",
    backgroundColor: "#f5c518",
    color: "#111111",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: "8px",
    opacity: loading ? 0.7 : 1,
  };

  // ── Expired state ──────────────────────────────────────────────────────────

  if (tokenExpired) {
    return (
      <div style={ROOT}>
        <div style={CARD}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "36px" }}>⏰</span>
            <h1 style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: "12px 0 6px" }}>
              Link request expired
            </h1>
            <p style={{ color: "#9a9078", fontSize: "13px", lineHeight: 1.6 }}>
              The confirmation window has expired. Please try signing in with Google again.
            </p>
          </div>
          <Link
            to="/login"
            style={{
              display: "block", width: "100%", padding: "13px", textAlign: "center",
              backgroundColor: "#f5c518", color: "#111", borderRadius: "6px",
              textDecoration: "none", fontWeight: 700, fontSize: "13px",
              letterSpacing: "0.08em", textTransform: "uppercase", boxSizing: "border-box",
            }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div style={ROOT}>
      {/* Logo */}
      <Link
        to="/"
        style={{ color: "#f5c518", fontWeight: 900, fontSize: "22px", letterSpacing: "-0.04em", marginBottom: "32px", textDecoration: "none" }}
      >
        SNITCH
      </Link>

      <div style={CARD}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          {/* Google + lock icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "#1e1e1e", border: "1px solid #2a2a2a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </span>
            <svg width="16" height="16" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: "#1e1e1e", border: "1px solid #2a2a2a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" fill="none" stroke="#f5c518" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
          </div>

          <h1 style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
            Connect your Google account
          </h1>
          <p style={{ color: "#9a9078", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
            An account already exists for{" "}
            <strong style={{ color: "#e0e0e0" }}>{emailFromToken}</strong>.
            Enter your password to verify it's yours, then Google will be linked.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px",
            color: "#f87171", fontSize: "13px", marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#5a5a5a", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "8px" }}>
              Your Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="link-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                autoFocus
                style={{ ...INPUT, paddingRight: "42px" }}
                onFocus={(e) => (e.target.style.borderColor = "#f5c518")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#5a5a5a", padding: 0,
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            id="link-submit"
            type="submit"
            disabled={loading || !password.trim()}
            style={BTN}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? "Verifying…" : "Confirm & Link Google"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: "20px", fontSize: "12px", color: "#4e4633", textAlign: "center" }}>
          Changed your mind?{" "}
          <Link to="/login" style={{ color: "#9a9078", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
          >
            Sign in normally
          </Link>
        </p>
      </div>
    </div>
  );
}
