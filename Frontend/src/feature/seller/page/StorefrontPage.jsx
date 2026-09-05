import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";

// ── Helper: format price ────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString("en-IN");
}

function discountPct(price, compare) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

// ── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const disc = discountPct(product.price, product.compare_at_price);
  const isOutOfStock = product.stock === 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${hovered ? "#3a3a3a" : "#222"}`,
          backgroundColor: "#161616",
          transition: "all 0.22s ease",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.45)" : "none",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Thumbnail */}
        <div style={{ aspectRatio: "3/4", backgroundColor: "#1a1a1a", position: "relative", overflow: "hidden" }}>
          {product.cover_image_url ? (
            <img
              src={product.cover_image_url}
              alt={product.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.35s ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" fill="none" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 5 }}>
            {disc && (
              <span style={{ backgroundColor: "#f5c518", color: "#111", fontSize: 10, fontWeight: 900, padding: "3px 7px", borderRadius: 4, letterSpacing: "0.05em" }}>
                -{disc}%
              </span>
            )}
            {isOutOfStock && (
              <span style={{ backgroundColor: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 4 }}>
                OUT OF STOCK
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px 14px" }}>
          <p style={{ color: "#e5e2e1", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
            <span style={{ color: "#f5c518", fontWeight: 800, fontSize: 14 }}>&#8377;{fmt(product.price)}</span>
            {product.compare_at_price && (
              <span style={{ color: "#5a5a5a", fontSize: 12, textDecoration: "line-through" }}>&#8377;{fmt(product.compare_at_price)}</span>
            )}
          </div>
          {product.tags && product.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag} style={{ backgroundColor: "#1f1f1f", border: "1px solid #2a2a2a", color: "#9a9078", fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Category Section (for "All" view) ──────────────────────────────────────
function CategorySection({ category, products }) {
  const label = category.toUpperCase();
  return (
    <section id={`cat-${category}`} style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: "#f5c518", flexShrink: 0 }} />
        <h2 style={{ color: "#ffffff", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.12em", margin: 0 }}>
          {label}
        </h2>
        <span style={{ color: "#5a5a5a", fontSize: 12, fontWeight: 600 }}>({products.length})</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// ── Sticky Category Tab Bar ─────────────────────────────────────────────────
function CategoryTabs({ categories, active, onChange }) {
  const tabs = ["all", ...categories];
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "rgba(17,17,17,0.96)",
        borderBottom: "1px solid #1f1f1f",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "14px 20px",
                fontSize: 11,
                fontWeight: isActive ? 900 : 600,
                letterSpacing: "0.12em",
                color: isActive ? "#f5c518" : "#9a9078",
                borderBottom: isActive ? "2px solid #f5c518" : "2px solid transparent",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                transition: "color 0.15s ease",
                flexShrink: 0,
              }}
            >
              {tab === "all" ? "All Products" : tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Storefront Page ────────────────────────────────────────────────────
export default function StorefrontPage() {
  const { slug } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function fetchStorefront() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/seller/storefront/${slug}`);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || "Store not found");
        }
        const json = await res.json();
        setStoreData(json);
        setActiveCategory("all");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStorefront();
  }, [slug]);

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: "#111", minHeight: "100vh" }}>
        <style>{`@keyframes sf-pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
        <div style={{ height: 300, backgroundColor: "#1a1a1a", animation: "sf-pulse 1.5s ease-in-out infinite" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px" }}>
          <div style={{ height: 32, width: 220, borderRadius: 8, backgroundColor: "#1f1f1f", marginBottom: 16, animation: "sf-pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 32 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 310, borderRadius: 12, backgroundColor: "#1a1a1a", animation: "sf-pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error / Not Found ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ backgroundColor: "#111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" fill="none" stroke="#9a9078" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ color: "#9a9078", fontSize: 15, fontWeight: 600, margin: 0 }}>{error}</p>
        <Link to="/" style={{ color: "#f5c518", fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.08em" }}>
          &#8592; BACK TO SNITCH
        </Link>
      </div>
    );
  }

  const { store, products, categories, totalProducts, totalStock } = storeData;
  const verified = store.verification_status === "approved";

  // Products to display based on active tab
  const displayedFlat = activeCategory === "all"
    ? products
    : products.filter((p) => p.category?.toLowerCase() === activeCategory);

  // Build grouped map for "all" view
  const grouped = {};
  if (activeCategory === "all") {
    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.category?.toLowerCase() === cat);
      if (catProducts.length > 0) grouped[cat] = catProducts;
    });
    // Uncategorized
    const uncat = products.filter((p) => !p.category);
    if (uncat.length > 0) grouped["other"] = uncat;
  }

  return (
    <div style={{ backgroundColor: "#111111", minHeight: "100vh", color: "#e5e2e1", fontFamily: "'Geist','Inter',system-ui,sans-serif" }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 56,
          backgroundColor: "rgba(17,17,17,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1f1f1f",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", boxSizing: "border-box",
        }}
      >
        <Link to="/" style={{ color: "#f5c518", textDecoration: "none", fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em" }}>
          SNITCH
        </Link>
        <Link to="/" style={{ color: "#9a9078", textDecoration: "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          &#8592; Home
        </Link>
      </nav>

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 56 }}>
        <div style={{ position: "relative", height: 300, overflow: "hidden", backgroundColor: "#161616" }}>
          {/* Banner */}
          {store.banner_url ? (
            <img src={store.banner_url} alt="Store banner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 45%, #1c1509 75%, #261c00 100%)" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "repeating-linear-gradient(45deg, #f5c518 0, #f5c518 1px, transparent 0, transparent 50%)", backgroundSize: "24px 24px" }} />
            </div>
          )}

          {/* Gradient overlay — bottom fade to bg */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #111111 0%, rgba(17,17,17,0.65) 50%, rgba(17,17,17,0.08) 100%)" }} />

          {/* Store Identity */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              maxWidth: 1280, margin: "0 auto",
              padding: "0 32px 28px",
              display: "flex", alignItems: "flex-end", gap: 20,
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 76, height: 76, borderRadius: 14, flexShrink: 0,
                backgroundColor: "#1a1a1a", border: "2px solid rgba(245,197,24,0.3)",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
              }}
            >
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 30, fontWeight: 900, color: "#f5c518", letterSpacing: "-0.04em" }}>
                  {store.store_name?.[0]?.toUpperCase() ?? "S"}
                </span>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", margin: 0, lineHeight: 1 }}>
                  {store.store_name}
                </h1>
                {verified && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                )}
              </div>
              {store.bio && (
                <p style={{ color: "#9a9078", fontSize: 13, margin: "0 0 10px", maxWidth: 500, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {store.bio}
                </p>
              )}
              {/* Stat chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {[
                  `${totalProducts} Product${totalProducts !== 1 ? "s" : ""}`,
                  `${categories.length} Categor${categories.length !== 1 ? "ies" : "y"}`,
                  `${totalStock.toLocaleString("en-IN")} In Stock`,
                ].map((label) => (
                  <span key={label} style={{ backgroundColor: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.2)", color: "#f5c518", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.06em" }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Category Tabs ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
      )}

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 96px" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "96px 0" }}>
            <p style={{ color: "#3a3a3a", fontSize: 15, fontWeight: 600 }}>No products listed yet in this store.</p>
          </div>
        ) : activeCategory === "all" ? (
          Object.entries(grouped).map(([cat, catProducts]) => (
            <CategorySection key={cat} category={cat} products={catProducts} />
          ))
        ) : (
          displayedFlat.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "#5a5a5a", fontSize: 14 }}>No products in "{activeCategory}".</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
              {displayedFlat.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "20px 32px", textAlign: "center" }}>
        <p style={{ color: "#2a2a2a", fontSize: 11, margin: 0, letterSpacing: "0.08em" }}>
          POWERED BY{" "}
          <Link to="/" style={{ color: "#f5c518", textDecoration: "none", fontWeight: 900 }}>SNITCH</Link>
        </p>
      </footer>
    </div>
  );
}
