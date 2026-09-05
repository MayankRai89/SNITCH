import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useCreateSellerProfile, useCheckSlug } from "../hook/useseller";

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual / Sole Proprietor" },
  { value: "business", label: "Registered Business (Partnership / Pvt. Ltd.)" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SectionCard({ step, title, children }) {
  return (
    <div
      className="rounded-lg p-7"
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      <div className="flex items-center gap-4 mb-7">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0 text-sm font-black"
          style={{ width: 36, height: 36, backgroundColor: "rgba(245,197,24,0.15)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.3)" }}
        >
          {step}
        </div>
        <h2 className="text-base font-semibold uppercase tracking-widest" style={{ color: "#e5e2e1", letterSpacing: "0.1em" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#9a9078" }}>
      {children}{required && <span style={{ color: "#f5c518" }}> *</span>}
    </label>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const createProfile = useCreateSellerProfile();
  const checkSlug = useCheckSlug();

  const [form, setForm] = useState({
    store_name: "",
    store_slug: "",
    business_type: "individual",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    bio: "",
  });

  const [slugStatus, setSlugStatus] = useState(null); // null | "checking" | "available" | "taken"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const slugDebounceRef = useRef(null);

  // Auto-generate slug from store name
  useEffect(() => {
    if (!form.store_name) return;
    const generated = slugify(form.store_name);
    setForm((prev) => ({ ...prev, store_slug: generated }));
  }, [form.store_name]);

  // Debounced slug availability check
  useEffect(() => {
    if (!form.store_slug || form.store_slug.length < 3) {
      setSlugStatus(null);
      return;
    }
    setSlugStatus("checking");
    clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(async () => {
      const available = await checkSlug(form.store_slug);
      setSlugStatus(available ? "available" : "taken");
    }, 600);

    return () => clearTimeout(slugDebounceRef.current);
  }, [form.store_slug]);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.store_name.trim()) return setError("Store name is required.");
    if (!form.store_slug || !/^[a-z0-9-]+$/.test(form.store_slug)) return setError("Invalid store URL slug. Use lowercase letters, numbers and hyphens.");
    if (slugStatus === "taken") return setError("This store URL is taken. Please choose another.");
    if (!form.contact_phone.trim()) return setError("Contact phone is required.");
    if (!form.address_line1.trim()) return setError("Address is required.");
    if (!form.city.trim()) return setError("City is required.");
    if (!form.state) return setError("State is required.");
    if (!form.postal_code.trim()) return setError("Postal code is required.");

    setIsLoading(true);
    try {
      await createProfile({
        store_name: form.store_name.trim(),
        store_slug: form.store_slug.trim(),
        business_type: form.business_type,
        contact_phone: form.contact_phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        postal_code: form.postal_code.trim(),
        country: "IN",
        bio: form.bio.trim() || undefined,
      });
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create seller profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const SlugIndicator = () => {
    if (!form.store_slug) return null;
    if (slugStatus === "checking") return (
      <span className="text-xs" style={{ color: "#9a9078" }}>Checking availability…</span>
    );
    if (slugStatus === "available") return (
      <span className="text-xs flex items-center gap-1" style={{ color: "#4ade80" }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
        Available
      </span>
    );
    if (slugStatus === "taken") return (
      <span className="text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        Already taken
      </span>
    );
    return null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif" }}>

      {/* Navbar */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-[68px]"
        style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }}
      >
        <Link to="/" className="text-xl font-black" style={{ color: "#f5c518", textDecoration: "none", letterSpacing: "-0.03em" }}>
          SNITCH
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9a9078" }}>
          Seller Onboarding
        </p>
      </nav>

      <main className="pt-[68px]">
        <div className="max-w-[760px] mx-auto px-6 py-14">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c518", letterSpacing: "0.18em" }}>
              Welcome, Seller
            </p>
            <h1 className="font-black leading-none mb-3" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.03em", color: "#ffffff" }}>
              Set Up Your Store
            </h1>
            <p className="text-base" style={{ color: "#9a9078" }}>
              Complete your seller profile to start listing products on SNITCH.
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-10">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div
                  className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: "#f5c518", opacity: n === 1 ? 1 : 0.2 }}
                />
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 rounded-lg px-5 py-4 text-sm font-medium flex items-center gap-3"
              style={{ backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

            {/* Section 1: Store Identity */}
            <SectionCard step="1" title="Store Identity">
              <div className="flex flex-col gap-5">

                {/* Store Name */}
                <div>
                  <FieldLabel htmlFor="store-name" required>Store Name</FieldLabel>
                  <input
                    id="store-name"
                    type="text"
                    placeholder="e.g. Obsidian Collective"
                    value={form.store_name}
                    onChange={setField("store_name")}
                    className="snitch-input"
                    required
                  />
                </div>

                {/* Store Slug */}
                <div>
                  <FieldLabel htmlFor="store-slug" required>Store URL</FieldLabel>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                      style={{ color: "#4a4a4a" }}
                    >
                      snitch.in/
                    </span>
                    <input
                      id="store-slug"
                      type="text"
                      placeholder="obsidian-collective"
                      value={form.store_slug}
                      onChange={(e) => {
                        const v = slugify(e.target.value);
                        setForm((prev) => ({ ...prev, store_slug: v }));
                      }}
                      className="snitch-input"
                      style={{ paddingLeft: "5.5rem" }}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs" style={{ color: "#4a4a4a" }}>Lowercase letters, numbers and hyphens only</p>
                    <SlugIndicator />
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <FieldLabel htmlFor="business-type">Business Type</FieldLabel>
                  <select
                    id="business-type"
                    value={form.business_type}
                    onChange={setField("business_type")}
                    className="snitch-input"
                    style={{ appearance: "none", cursor: "pointer" }}
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t.value} value={t.value} style={{ backgroundColor: "#1a1a1a" }}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div>
                  <FieldLabel htmlFor="store-bio">Store Bio</FieldLabel>
                  <textarea
                    id="store-bio"
                    rows={3}
                    placeholder="Tell buyers what makes your brand unique…"
                    value={form.bio}
                    onChange={setField("bio")}
                    className="snitch-input resize-none"
                    style={{ lineHeight: "1.6" }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 2: Contact & Address */}
            <SectionCard step="2" title="Contact & Address">
              <div className="flex flex-col gap-5">

                <div>
                  <FieldLabel htmlFor="contact-phone" required>Contact Phone</FieldLabel>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.contact_phone}
                    onChange={setField("contact_phone")}
                    className="snitch-input"
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="address-line1" required>Address Line 1</FieldLabel>
                  <input
                    id="address-line1"
                    type="text"
                    placeholder="Street address, building, shop number"
                    value={form.address_line1}
                    onChange={setField("address_line1")}
                    className="snitch-input"
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="address-line2">Address Line 2</FieldLabel>
                  <input
                    id="address-line2"
                    type="text"
                    placeholder="Landmark, area (optional)"
                    value={form.address_line2}
                    onChange={setField("address_line2")}
                    className="snitch-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel htmlFor="city" required>City</FieldLabel>
                    <input
                      id="city"
                      type="text"
                      placeholder="Mumbai"
                      value={form.city}
                      onChange={setField("city")}
                      className="snitch-input"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="state" required>State</FieldLabel>
                    <select
                      id="state"
                      value={form.state}
                      onChange={setField("state")}
                      className="snitch-input"
                      style={{ appearance: "none", cursor: "pointer" }}
                      required
                    >
                      <option value="">Select state…</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} style={{ backgroundColor: "#1a1a1a" }}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="postal-code" required>Postal Code</FieldLabel>
                    <input
                      id="postal-code"
                      type="text"
                      placeholder="400001"
                      maxLength={6}
                      value={form.postal_code}
                      onChange={setField("postal_code")}
                      className="snitch-input"
                      required
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Section 3: Agreement & Submit */}
            <SectionCard step="3" title="Agreement">
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "#9a9078" }}>
                By completing onboarding you agree to SNITCH's{" "}
                <span style={{ color: "#f5c518", cursor: "pointer" }}>Seller Terms of Service</span>
                {" "}and{" "}
                <span style={{ color: "#f5c518", cursor: "pointer" }}>Marketplace Policies</span>.
                Your profile will be reviewed by our team before you're marked as verified.
              </p>

              <button
                id="onboarding-submit"
                type="submit"
                disabled={isLoading || slugStatus === "taken" || slugStatus === "checking"}
                className="w-full py-4 rounded-lg text-sm font-black uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: "#f5c518",
                  color: "#111111",
                  border: "none",
                  cursor: (isLoading || slugStatus === "taken" || slugStatus === "checking") ? "not-allowed" : "pointer",
                  opacity: (isLoading || slugStatus === "taken") ? 0.65 : 1,
                  letterSpacing: "0.12em",
                  boxShadow: "0 4px 24px rgba(245,197,24,0.2)",
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = "0 4px 32px rgba(245,197,24,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,197,24,0.2)")}
              >
                {isLoading ? "Creating your store…" : "Complete Onboarding →"}
              </button>
            </SectionCard>
          </form>
        </div>
      </main>
    </div>
  );
}
