import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch } from "react-redux";
import { completeGoogleSignup } from "./services/auth.api";
import { login } from "./state/auth.slice";

export default function RoleSelectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = searchParams.get("token");
  const [selected, setSelected] = useState(null); // "buyer" | "seller"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard: if no token, something went wrong — redirect back to login
  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  async function handleConfirm() {
    if (!selected || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const data = await completeGoogleSignup({ token, role: selected });
      if (data.user) {
        dispatch(login({ user: data.user, token: null }));
      }
      navigate(data.redirect ?? "/homepage", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      // If the pending token expired, send them back to Google
      if (err?.response?.status === 401) {
        setError("Your session expired. Please sign in with Google again.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: "#111111" }}
    >
      <main className="w-full max-w-[520px]">
        {/* Brand */}
        <header className="mb-10 text-center">
          <h1
            className="text-4xl font-extrabold tracking-tighter"
            style={{ color: "#f5c518", letterSpacing: "-0.03em" }}
          >
            SNITCH
          </h1>
          <p className="mt-3 text-base font-medium" style={{ color: "#c8b99a" }}>
            One last step — how are you joining?
          </p>
          <p className="mt-1 text-sm" style={{ color: "#5a5a5a" }}>
            This sets up your experience and cannot be changed later.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(220,38,38,0.35)",
              color: "#f87171",
            }}
          >
            {error}{" "}
            {error.includes("expired") && (
              <button
                className="underline ml-1"
                style={{ color: "#f5c518", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => (window.location.href = "/api/auth/google")}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Buyer card */}
          <button
            id="role-buyer"
            type="button"
            onClick={() => setSelected("buyer")}
            style={{
              background: selected === "buyer"
                ? "linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))"
                : "#1a1a1a",
              border: selected === "buyer" ? "2px solid #f5c518" : "2px solid #2a2a2a",
              borderRadius: "12px",
              padding: "28px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
            onMouseEnter={(e) => {
              if (selected !== "buyer") e.currentTarget.style.borderColor = "#444";
            }}
            onMouseLeave={(e) => {
              if (selected !== "buyer") e.currentTarget.style.borderColor = "#2a2a2a";
            }}
          >
            {/* Buyer icon */}
            <span
              style={{
                width: 52, height: 52, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                backgroundColor: selected === "buyer" ? "rgba(245,197,24,0.18)" : "#252525",
                transition: "background 0.2s",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={selected === "buyer" ? "#f5c518" : "#8a8070"}
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <div>
              <p
                className="text-base font-bold"
                style={{ color: selected === "buyer" ? "#f5c518" : "#e0e0e0" }}
              >
                Buyer
              </p>
              <p className="text-xs mt-1" style={{ color: "#6a6a6a" }}>
                Browse &amp; purchase
              </p>
            </div>

            {/* Selected indicator */}
            {selected === "buyer" && (
              <span
                style={{
                  width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: "#f5c518",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>

          {/* Seller card */}
          <button
            id="role-seller"
            type="button"
            onClick={() => setSelected("seller")}
            style={{
              background: selected === "seller"
                ? "linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))"
                : "#1a1a1a",
              border: selected === "seller" ? "2px solid #f5c518" : "2px solid #2a2a2a",
              borderRadius: "12px",
              padding: "28px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
            onMouseEnter={(e) => {
              if (selected !== "seller") e.currentTarget.style.borderColor = "#444";
            }}
            onMouseLeave={(e) => {
              if (selected !== "seller") e.currentTarget.style.borderColor = "#2a2a2a";
            }}
          >
            {/* Seller icon */}
            <span
              style={{
                width: 52, height: 52, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                backgroundColor: selected === "seller" ? "rgba(245,197,24,0.18)" : "#252525",
                transition: "background 0.2s",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={selected === "seller" ? "#f5c518" : "#8a8070"}
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <div>
              <p
                className="text-base font-bold"
                style={{ color: selected === "seller" ? "#f5c518" : "#e0e0e0" }}
              >
                Seller
              </p>
              <p className="text-xs mt-1" style={{ color: "#6a6a6a" }}>
                List &amp; sell products
              </p>
            </div>

            {/* Selected indicator */}
            {selected === "seller" && (
              <span
                style={{
                  width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: "#f5c518",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        </div>

        {/* Confirm button */}
        <button
          id="role-confirm"
          type="button"
          disabled={!selected || isLoading}
          onClick={handleConfirm}
          className="w-full py-3.5 rounded text-sm font-bold uppercase tracking-widest transition-all"
          style={{
            backgroundColor: selected ? "#f5c518" : "#2a2a2a",
            color: selected ? "#111111" : "#4a4a4a",
            letterSpacing: "0.1em",
            border: "none",
            cursor: !selected || isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.65 : 1,
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => selected && !isLoading && (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => selected && !isLoading && (e.currentTarget.style.opacity = "1")}
        >
          {isLoading ? "Setting up your account…" : selected ? `Join as ${selected.charAt(0).toUpperCase() + selected.slice(1)}` : "Select a role to continue"}
        </button>

        <p className="text-center mt-6 text-xs" style={{ color: "#4a4a4a" }}>
          Already have an account?{" "}
          <button
            style={{ color: "#f5c518", background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }}
            onClick={() => navigate("/login")}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Sign in
          </button>
        </p>
      </main>
    </div>
  );
}
