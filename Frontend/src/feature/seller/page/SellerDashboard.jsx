import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { useGetSellerProfile, useSeller } from "../hook/useseller";
import { useGetSellerProducts, useProduct } from "../../product/hook/useproduct";
import { removeProduct } from "../../product/state/product.slice";
import { deleteProduct } from "../../product/services/product.api";

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-lg p-6 flex flex-col gap-2"
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9a9078", letterSpacing: "0.12em" }}>
        {label}
      </p>
      <p className="font-black" style={{ fontSize: "2rem", letterSpacing: "-0.03em", color: accent ?? "#ffffff", lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: "#5a5a5a" }}>{sub}</p>
      )}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyProducts({ onAdd }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-20 px-8 text-center"
      style={{ border: "2px dashed #2a2a2a", backgroundColor: "#161616" }}
    >
      <div
        className="flex items-center justify-center rounded-xl mb-5"
        style={{ width: 64, height: 64, backgroundColor: "#222", border: "1px solid #2a2a2a" }}
      >
        <svg width="28" height="28" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: "#e5e2e1" }}>No products yet</h3>
      <p className="text-sm mb-7" style={{ color: "#9a9078" }}>
        Start building your catalogue — drop your first product on SNITCH.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded text-sm font-black uppercase tracking-widest"
        style={{ backgroundColor: "#f5c518", color: "#111", border: "none", cursor: "pointer", letterSpacing: "0.1em", boxShadow: "0 4px 20px rgba(245,197,24,0.25)" }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 32px rgba(245,197,24,0.45)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,24,0.25)")}
      >
        + List First Product
      </button>
    </div>
  );
}

// ── Product Row ────────────────────────────────────────────────────────────────

function ProductRow({ product, onDelete }) {
  const isActive = product.is_active;
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-lg transition-colors group"
      style={{ border: "1px solid #2a2a2a", backgroundColor: "#1a1a1a" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 rounded overflow-hidden"
        style={{ width: 52, height: 52, backgroundColor: "#222", border: "1px solid #2a2a2a" }}
      >
        {product.cover_image_url ? (
          <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="20" height="20" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>

      {/* Title + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#e5e2e1" }}>{product.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "#9a9078" }}>
          {product.category?.toUpperCase()} {product.sku ? `· ${product.sku}` : ""}
        </p>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0 w-24">
        <p className="text-sm font-bold" style={{ color: "#f5c518" }}>
          ₹{Number(product.price).toLocaleString("en-IN")}
        </p>
        {product.compare_at_price && (
          <p className="text-xs line-through" style={{ color: "#5a5a5a" }}>
            ₹{Number(product.compare_at_price).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="flex-shrink-0 w-16 text-center">
        <p className="text-sm font-semibold" style={{ color: product.stock === 0 ? "#ef4444" : "#e5e2e1" }}>
          {product.stock}
        </p>
        <p className="text-xs" style={{ color: "#5a5a5a" }}>in stock</p>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span
          className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded"
          style={{
            backgroundColor: isActive ? "rgba(74,222,128,0.1)" : "rgba(107,114,128,0.15)",
            color: isActive ? "#4ade80" : "#9a9078",
            border: `1px solid ${isActive ? "rgba(74,222,128,0.25)" : "#2a2a2a"}`,
          }}
        >
          {isActive ? "Live" : "Draft"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to={`/seller/products/edit/${product.id}`}
          className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          style={{
            backgroundColor: "#222",
            color: "#f5c518",
            border: "1px solid #333",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5c518";
            e.currentTarget.style.color = "#111";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#222";
            e.currentTarget.style.color = "#f5c518";
          }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="p-1.5 rounded text-xs text-[#666] hover:text-red-400 hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-900/50"
            title="Delete product"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const getSellerProfile = useGetSellerProfile();
  const getSellerProducts = useGetSellerProducts();
  const { profile, isLoading: sellerLoading } = useSeller();
  const { sellerProducts, isLoading: productsLoading } = useProduct();

  const [initialized, setInitialized] = useState(false);

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) return;
    try {
      await deleteProduct(product.id);
      dispatch(removeProduct(product.id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete product.");
    }
  };

  // On mount: fetch seller profile + products
  useEffect(() => {
    async function init() {
      try {
        const seller = await getSellerProfile();

        // If no seller profile exists, redirect to onboarding
        if (!seller) {
          navigate("/seller/onboarding", { replace: true });
          return;
        }

        await getSellerProducts();
      } catch {
        // Errors are handled inside hooks
      } finally {
        setInitialized(true);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = !initialized || sellerLoading;

  // Stats derived from products
  const totalProducts = sellerProducts.length;
  const liveProducts = sellerProducts.filter((p) => p.is_active).length;
  const totalStock = sellerProducts.reduce((acc, p) => acc + (p.stock || 0), 0);

  // ── Skeleton loader ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#111111" }}>
        <nav className="fixed top-0 w-full h-[68px]" style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }} />
        <main className="pt-[68px] max-w-[1280px] mx-auto px-8 py-12">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-8 w-56 rounded" style={{ backgroundColor: "#2a2a2a" }} />
            <div className="grid grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-lg" style={{ backgroundColor: "#1a1a1a" }} />
              ))}
            </div>
            <div className="h-96 rounded-lg" style={{ backgroundColor: "#1a1a1a" }} />
          </div>
        </main>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

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

        <div className="flex items-center gap-5">
          {/* Storefront link */}
          {profile?.store_slug && (
            <Link
              to={`/store/${profile.store_slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
              style={{ color: "#9a9078", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              My Store
            </Link>
          )}

          {/* Add product CTA */}
          <Link
            to="/seller/products/new"
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all"
            style={{ backgroundColor: "#f5c518", color: "#111", textDecoration: "none", letterSpacing: "0.1em" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,24,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </Link>

          {/* User menu */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors"
            style={{ border: "1px solid #2a2a2a", backgroundColor: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
          >
            <div
              className="flex items-center justify-center rounded-full text-xs font-black flex-shrink-0"
              style={{ width: 24, height: 24, backgroundColor: "#f5c518", color: "#111" }}
            >
              {user?.full_name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <span className="text-xs font-semibold" style={{ color: "#e5e2e1", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name ?? "Seller"}
            </span>
          </div>
        </div>
      </nav>

      <main className="pt-[68px]">
        <div className="max-w-[1280px] mx-auto px-8 py-12">

          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c518", letterSpacing: "0.18em" }}>
                Seller Dashboard
              </p>
              <h1 className="font-black leading-none" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", letterSpacing: "-0.03em", color: "#ffffff" }}>
                {profile?.store_name ?? "Your Store"}
              </h1>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-5 mb-10 lg:grid-cols-4">
            <StatCard
              label="Total Products"
              value={totalProducts}
              sub="in your catalogue"
            />
            <StatCard
              label="Live Products"
              value={liveProducts}
              sub="visible to buyers"
              accent="#f5c518"
            />
            <StatCard
              label="Total Stock"
              value={totalStock.toLocaleString("en-IN")}
              sub="units across all products"
            />
            <StatCard
              label="Store Status"
              value={profile?.is_active ? "Active" : "Paused"}
              sub={profile?.store_slug ? `snitch.in/${profile.store_slug}` : ""}
              accent={profile?.is_active ? "#4ade80" : "#9a9078"}
            />
          </div>

          {/* Products section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#f5c518" }} />
                <h2 className="text-base font-semibold uppercase tracking-widest" style={{ color: "#e5e2e1", letterSpacing: "0.1em" }}>
                  Your Products
                </h2>
                {totalProducts > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "#2a2a2a", color: "#9a9078" }}
                  >
                    {totalProducts}
                  </span>
                )}
              </div>

              {totalProducts > 0 && (
                <Link
                  to="/seller/products/new"
                  className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded flex items-center gap-2 transition-all"
                  style={{ backgroundColor: "#f5c518", color: "#111", textDecoration: "none", letterSpacing: "0.1em" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,24,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Product
                </Link>
              )}
            </div>

            {productsLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: "#1a1a1a" }} />
                ))}
              </div>
            ) : sellerProducts.length === 0 ? (
              <EmptyProducts onAdd={() => navigate("/seller/products/new")} />
            ) : (
              <div className="flex flex-col gap-3">
                {sellerProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
