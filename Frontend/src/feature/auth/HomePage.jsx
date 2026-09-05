import { Link, useNavigate } from "react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPublicCatalog } from "../product/services/product.api";
import { addToCart, openCart } from "../cart/state/cart.slice";
import CartDrawer from "../cart/components/CartDrawer";
import { toggleWishlist, openWishlist } from "../wishlist/state/wishlist.slice";
import WishlistDrawer from "../wishlist/components/WishlistDrawer";

import {
  DEPARTMENTS,
  CATEGORY_TREE,
} from "../product/utils/categoryHierarchy";

// Top visual category story items for quick browsing
const QUICK_STORIES = [
  {
    id: "footwear",
    label: "Footwear",
    sub: "Sneakers & Kicks",
    tag: "HOT",
    icon: "👟",
    targetCategory: "footwear",
    img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "clothing-tees",
    label: "Oversized Tees",
    sub: "Graphic & Plain",
    tag: "DROP",
    icon: "👕",
    targetCategory: "clothing",
    targetSubcategory: "t-shirts",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "streetwear-hoodies",
    label: "Hoodies & Jackets",
    sub: "Winter & Heavy",
    tag: "TREND",
    icon: "🔥",
    targetCategory: "streetwear",
    targetSubcategory: "hoodies",
    img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "clothing-cargos",
    label: "Cargos & Denim",
    sub: "Baggy & Slim",
    tag: "NEW",
    icon: "👖",
    targetCategory: "clothing",
    targetSubcategory: "cargos",
    img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "dept-men",
    label: "Men's Edit",
    sub: "Street & Casual",
    tag: "POPULAR",
    icon: "🕶️",
    targetDepartment: "Men",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "dept-women",
    label: "Women's Edit",
    sub: "Elevated Street",
    tag: "EXCLUSIVE",
    icon: "✨",
    targetDepartment: "Women",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "electronics",
    label: "Tech & Audio",
    sub: "Earbuds & Gear",
    tag: "TECH",
    icon: "💻",
    targetCategory: "electronics",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "accessories",
    label: "Accessories",
    sub: "Chains, Caps, Bags",
    tag: "GEAR",
    icon: "🎧",
    targetCategory: "accessories",
    img: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=300&auto=format&fit=crop&q=80",
  },
];

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="#f5c518" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "100% Verified Drops",
    desc: "Every product is authenticated directly from verified independent sellers.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="#f5c518" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: "Buyer Protection",
    desc: "Instant returns, secure UPI & card checkout with end-to-end buyer guarantee.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="#f5c518" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Fast Express Delivery",
    desc: "Pan-India dispatch with live tracking updates directly in your dashboard.",
  },
];

// ── SearchOverlay ──────────────────────────────────────────────────────────────

function SearchOverlay({ onClose, products, onSelectProduct }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const searchData = useMemo(() => {
    const prods = (products || []).map((p) => ({
      type: "product",
      id: p.id,
      slug: p.slug,
      label: p.title,
      sub: `₹${Number(p.price).toLocaleString("en-IN")} • ${p.seller?.store_name || "SNITCH Seller"}`,
      tag: p.tags?.[0] || null,
      cover: p.cover_image_url,
      raw: p,
    }));

    const cats = Object.entries(CATEGORY_TREE).map(([key, cat]) => ({
      type: "category",
      id: key,
      label: `${cat.icon} ${cat.label}`,
      sub: "Explore Category",
      tag: "CATEGORY",
      cover: null,
    }));

    return [...prods, ...cats];
  }, [products]);

  const results = useMemo(() => {
    if (!query.trim()) return searchData.slice(0, 10);
    const q = query.toLowerCase();
    return searchData.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sub && item.sub.toLowerCase().includes(q))
    );
  }, [searchData, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Search Catalog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "90px",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "#161616",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid #2a2a2a",
            backgroundColor: "#111111",
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="#f5c518"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="search-input-overlay"
            ref={inputRef}
            type="text"
            placeholder="Search footwear, oversized tees, hoodies, cargos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "18px 12px",
              fontSize: "15px",
              color: "#ffffff",
              caretColor: "#f5c518",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#777",
                padding: "4px",
              }}
            >
              ✕
            </button>
          )}
          <kbd
            style={{
              marginLeft: "8px",
              padding: "2px 7px",
              fontSize: "10px",
              color: "#777",
              border: "1px solid #333",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "380px", overflowY: "auto" }}>
          {results.length === 0 ? (
            <p
              style={{
                padding: "32px 20px",
                fontSize: "13px",
                color: "#777",
                textAlign: "center",
              }}
            >
              No products found for &ldquo;
              <span style={{ color: "#f5c518" }}>{query}</span>
              &rdquo;
            </p>
          ) : (
            <>
              <p
                style={{
                  padding: "10px 20px 4px",
                  fontSize: "10px",
                  color: "#666",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {query ? `Results (${results.length})` : "Popular Search Suggestions"}
              </p>
              {results.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onClose();
                    if (item.type === "product" && item.raw) {
                      onSelectProduct(item.raw);
                    }
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : "1px solid #202020",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#222222")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.label}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "6px",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #333",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "6px",
                        flexShrink: 0,
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                    >
                      {item.type === "product" ? "🛍️" : "🏷️"}
                    </span>
                  )}

                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#ffffff",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#9a9078",
                        marginTop: "1px",
                      }}
                    >
                      {item.sub}
                    </span>
                  </span>

                  {item.tag && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "3px 7px",
                        backgroundColor: item.tag === "CATEGORY" ? "#2a2a2a" : "#f5c518",
                        color: item.tag === "CATEGORY" ? "#f5c518" : "#111111",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      {item.tag}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid #222222",
            display: "flex",
            alignItems: "center",
            backgroundColor: "#111111",
          }}
        >
          <span style={{ fontSize: "10px", color: "#666" }}>
            Press Esc to exit
          </span>
          <span style={{ fontSize: "10px", color: "#f5c518", marginLeft: "auto", fontWeight: 600 }}>
            SNITCH Instant Search
          </span>
        </div>
      </div>
    </div>
  );
}

// ── QuickViewModal ─────────────────────────────────────────────────────────────

function QuickViewModal({ product, onClose }) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const isWishlisted = wishlistItems.some((item) => item.productId === product?.id);

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || "M");
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || "");
  const [activeImage, setActiveImage] = useState(product?.cover_image_url || "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImage(product.cover_image_url || product.images?.[0] || "");
      setSelectedSize(product.sizes?.[0] || "M");
      setSelectedColor(product.colors?.[0] || "");
      setAdded(false);
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const allImages = [
    product.cover_image_url,
    ...(product.images || []).filter((img) => img !== product.cover_image_url),
  ].filter(Boolean);

  const discountPercent =
    product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      ? Math.round(
          ((Number(product.compare_at_price) - Number(product.price)) /
            Number(product.compare_at_price)) *
            100
        )
      : null;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        coverImage: activeImage || product.cover_image_url,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        quantity: qty,
        sellerName: product.seller?.store_name || "SNITCH Exclusive",
        stock: product.stock,
      })
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 400);
  };

  const handleBuyNow = () => {
    dispatch(
      addToCart({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        coverImage: activeImage || product.cover_image_url,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        quantity: qty,
        sellerName: product.seller?.store_name || "SNITCH Exclusive",
        stock: product.stock,
      })
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Product Quick View"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        backgroundColor: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]"
        style={{ color: "#e5e2e1" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#222] hover:bg-[#333] text-[#9a9078] hover:text-[#f5c518] flex items-center justify-center transition-colors border border-[#333]"
        >
          ✕
        </button>

        {/* Left: Gallery */}
        <div className="w-full md:w-1/2 p-6 flex flex-col gap-4 bg-[#111] border-r border-[#222]">
          <div className="relative w-full aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2a2a2a]">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#555]">
                No image available
              </div>
            )}
            {product.tags?.[0] && (
              <span className="absolute top-3 left-3 bg-[#f5c518] text-[#111] font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
                {product.tags[0]}
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? "border-[#f5c518]" : "border-[#333] opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#f5c518] bg-[#f5c518]/10 px-2 py-0.5 rounded border border-[#f5c518]/20">
              {product.seller?.store_name || "Verified Seller"}
            </span>
            <span className="text-xs text-[#666] uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
            {product.title}
          </h2>

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-black text-[#f5c518]">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <>
                <span className="text-lg text-[#666] line-through">
                  ₹{Number(product.compare_at_price).toLocaleString("en-IN")}
                </span>
                {discountPercent && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    {discountPercent}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-[#9a9078] leading-relaxed mb-6 border-b border-[#222] pb-5">
              {product.description}
            </p>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888] block mb-2">
                Select Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 text-xs font-bold rounded uppercase transition-all ${
                      selectedSize === s
                        ? "bg-[#f5c518] text-[#111]"
                        : "bg-[#222] text-[#ccc] border border-[#333] hover:border-[#555]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888] block mb-2">
                Color: <span className="text-[#f5c518]">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                      selectedColor === c
                        ? "border-[#f5c518] bg-[#f5c518]/10 text-white"
                        : "border-[#333] bg-[#1e1e1e] text-[#aaa] hover:border-[#444]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 rounded font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: added ? "#10b981" : "#f5c518",
                color: "#111111",
              }}
            >
              {added ? "✓ Added to Bag" : "Add to Bag"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 rounded font-bold uppercase tracking-widest text-xs bg-transparent border border-[#555] hover:border-[#f5c518] text-white hover:text-[#f5c518] transition-colors"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => dispatch(toggleWishlist(product))}
                className={`px-4 py-3 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  isWishlisted
                    ? "bg-[#f5c518]/15 border-[#f5c518] text-[#f5c518]"
                    : "bg-[#222] border-[#333] text-[#aaa] hover:text-white hover:border-[#555]"
                }`}
              >
                {isWishlisted ? "Saved ❤️" : "Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar({ onOpenSearch, user, setUser }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const wishlistCount = wishlistItems.length;

  const isSeller = user && user.role === "seller";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-8 h-[72px]"
      style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter flex items-center gap-1.5"
          style={{ color: "#f5c518", letterSpacing: "-0.04em", textDecoration: "none" }}
        >
          <span>SNITCH</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30 hidden sm:inline-block">
            STREETWEAR
          </span>
        </Link>
      </div>

      {/* Center: Search Trigger Input Bar */}
      <div className="flex-1 max-w-lg mx-4 hidden md:block">
        <div
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-4 py-2 bg-[#1a1a1a] hover:bg-[#202020] border border-[#2a2a2a] hover:border-[#f5c518]/60 rounded-lg cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center gap-3 text-[#777]">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="text-[#888]">Search sneakers, oversized tees, hoodies, brands…</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#111] border border-[#333] rounded text-[#666]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3" style={{ color: "#f5c518" }}>
        {/* Mobile Search Icon */}
        <button
          id="navbar-search"
          title="Search"
          className="p-2 rounded transition-colors md:hidden text-[#e0e0e0] hover:text-[#f5c518]"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          onClick={onOpenSearch}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Wishlist */}
        <button
          id="navbar-wishlist"
          title="Wishlist"
          onClick={() => dispatch(openWishlist())}
          className="p-2 rounded transition-colors relative text-[#e0e0e0] hover:text-[#f5c518]"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {wishlistCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </button>

        {/* Shopping Bag Drawer Trigger */}
        <button
          id="navbar-bag"
          title="Shopping Bag"
          onClick={() => dispatch(openCart())}
          className="p-2 rounded transition-colors relative text-[#e0e0e0] hover:text-[#f5c518]"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>

        {/* Seller Portal Link */}
        {isSeller && (
          <Link
            to="/seller/dashboard"
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30 hover:bg-[#f5c518] hover:text-[#111] transition-all ml-1"
          >
            Seller Hub
          </Link>
        )}

        {/* Account Menu */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            id="navbar-account"
            className="p-2 rounded transition-colors flex items-center gap-1.5"
            style={{
              background: dropdownOpen ? "#1a1a1a" : "transparent",
              border: "none",
              cursor: "pointer",
              color: user ? "#f5c518" : "#e0e0e0",
            }}
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Account menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-xs font-bold">
              {user?.full_name ? user.full_name[0].toUpperCase() : (
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: "220px",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.75)",
                zIndex: 100,
              }}
            >
              <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #2a2a2a", backgroundColor: "#141414" }}>
                {user ? (
                  <>
                    <p style={{ fontSize: "13px", color: "#ffffff", fontWeight: 700, marginBottom: "2px" }}>
                      {user.full_name}
                    </p>
                    <p style={{ fontSize: "10px", color: "#f5c518", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                      {user.role} account
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "11px", color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                    Welcome to SNITCH
                  </p>
                )}
              </div>

              {user ? (
                <>
                  {user.role === "seller" ? (
                    <button
                      role="menuitem"
                      onClick={() => { setDropdownOpen(false); navigate("/seller/dashboard"); }}
                      style={{
                        width: "100%", padding: "12px 16px", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500, textAlign: "left",
                        borderBottom: "1px solid #222",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      📊 Seller Dashboard
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      onClick={() => { setDropdownOpen(false); navigate("/buyer/dashboard"); }}
                      style={{
                        width: "100%", padding: "12px 16px", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500, textAlign: "left",
                        borderBottom: "1px solid #222",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      📦 My Orders & Account
                    </button>
                  )}
                  <button
                    id="dropdown-signout"
                    role="menuitem"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                      setUser(false);
                    }}
                    style={{
                      width: "100%", padding: "12px 16px", background: "transparent",
                      border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                      gap: "10px", color: "#f87171", fontSize: "13px", fontWeight: 500, textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#221414")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="dropdown-login"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); navigate("/login"); }}
                    style={{
                      width: "100%", padding: "12px 16px", background: "transparent",
                      border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                      gap: "10px", color: "#f5c518", fontSize: "13px", fontWeight: 600,
                      textAlign: "left", borderBottom: "1px solid #222",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Sign In
                  </button>
                  <button
                    id="dropdown-register"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); navigate("/register"); }}
                    style={{
                      width: "100%", padding: "12px 16px", background: "transparent",
                      border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                      gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500, textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!user && (
          <Link
            to="/register"
            className="text-xs font-bold uppercase tracking-widest px-3.5 py-2 rounded transition-opacity"
            style={{
              backgroundColor: "#f5c518",
              color: "#111111",
              textDecoration: "none",
              letterSpacing: "0.08em",
            }}
          >
            Join
          </Link>
        )}
      </div>
    </nav>
  );
}

// ── ProductCard ────────────────────────────────────────────────────────────────

function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const isWishlisted = wishlistItems.some((item) => item.productId === product.id);

  const discountPercent =
    product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      ? Math.round(
          ((Number(product.compare_at_price) - Number(product.price)) /
            Number(product.compare_at_price)) *
            100
        )
      : null;

  return (
    <div
      onClick={() => navigate(`/product/${product.slug || product.id}`)}
      className="group flex flex-col cursor-pointer transition-all duration-300 rounded-lg overflow-hidden relative"
      style={{ border: "1px solid #2a2a2a", backgroundColor: "#161616" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5c518")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
    >
      {/* Image Area */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden bg-[#121212]">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.18">
            <rect x="8" y="14" width="48" height="36" rx="2" stroke="#f5c518" strokeWidth="2" />
            <circle cx="32" cy="32" r="10" stroke="#f5c518" strokeWidth="2" />
          </svg>
        )}

        {/* Tag badge */}
        {product.tags?.[0] && (
          <span
            className="absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2 py-0.5 tracking-widest uppercase z-10 rounded-sm"
            style={{ backgroundColor: "#f5c518", color: "#111111" }}
          >
            {product.tags[0]}
          </span>
        )}

        {/* Discount Badge */}
        {discountPercent && (
          <span
            className="absolute text-[10px] font-bold px-1.5 py-0.5 tracking-wider uppercase bg-red-600 text-white z-10 rounded-sm"
            style={{
              top: product.tags?.[0] ? "32px" : "10px",
              left: "10px",
            }}
          >
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Floating Button */}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={isWishlisted ? "In your Wishlist" : "Add to Wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(toggleWishlist(product));
          }}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[#111111]/80 hover:bg-[#111111] border border-[#333] hover:border-[#f5c518] shadow-md backdrop-blur-sm"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isWishlisted ? "#f5c518" : "none"}
            stroke={isWishlisted ? "#f5c518" : "#ffffff"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView(product);
            }}
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded shadow-lg bg-[#1a1a1a] hover:bg-[#f5c518] hover:text-[#111] text-white border border-[#444] transition-all transform translate-y-2 group-hover:translate-y-0"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-3.5 flex flex-col gap-1 flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#9a9078] mb-1">
            <span className="truncate">{product.seller?.store_name || "SNITCH DROP"}</span>
            {product.gender && <span className="text-[#666]">{product.gender}</span>}
          </div>
          <h4 className="text-sm font-semibold text-[#e5e2e1] line-clamp-1 group-hover:text-[#f5c518] transition-colors">
            {product.title}
          </h4>
        </div>

        <div className="flex items-baseline gap-2 mt-2 pt-1 border-t border-[#222]">
          <span className="text-base font-black text-[#f5c518]">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </span>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <span className="text-xs text-[#666] line-through">
              ₹{Number(product.compare_at_price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shelf Section (Amazon/Flipkart Style Categorized Feed) ─────────────────────

function CategorizedShelf({ title, subtitle, badge, icon, products, onQuickView, onExploreCategory }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-8 py-8 border-b border-[#222222]">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#f5c518] rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#f5c518]/15 text-[#f5c518] border border-[#f5c518]/30">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#9a9078] mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {onExploreCategory && (
          <button
            onClick={onExploreCategory}
            className="text-xs font-bold text-[#f5c518] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            View All ({products.length}) →
          </button>
        )}
      </div>

      {/* Grid of Shelf Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.slice(0, 5).map((p) => (
          <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Multi-level filtering states
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Check auth user status
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? false))
      .catch(() => setUser(false));
  }, []);

  // Fetch complete catalog
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicCatalog();
      if (data && data.products) {
        setAllProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Derived categorized product groups
  const footwearProducts = useMemo(() => {
    return allProducts.filter((p) => (p.category || "").toLowerCase() === "footwear");
  }, [allProducts]);

  const apparelProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      return cat === "clothing" || cat === "streetwear";
    });
  }, [allProducts]);

  const menProducts = useMemo(() => {
    return allProducts.filter((p) => (p.gender || "").toLowerCase() === "men");
  }, [allProducts]);

  const womenProducts = useMemo(() => {
    return allProducts.filter((p) => (p.gender || "").toLowerCase() === "women");
  }, [allProducts]);

  // Filtered explorer products
  const explorerProducts = useMemo(() => {
    let list = [...allProducts];

    if (selectedDepartment !== "all") {
      list = list.filter((p) => (p.gender || "").toLowerCase() === selectedDepartment.toLowerCase());
    }

    if (selectedCategory !== "all") {
      list = list.filter((p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedSubcategory !== "all") {
      list = list.filter((p) => (p.subcategory || "").toLowerCase() === selectedSubcategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.seller?.store_name?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-low") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [allProducts, selectedDepartment, selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  // Handlers for quick story filters
  const handleStoryClick = (story) => {
    if (story.targetCategory) setSelectedCategory(story.targetCategory);
    if (story.targetSubcategory) setSelectedSubcategory(story.targetSubcategory);
    if (story.targetDepartment) setSelectedDepartment(story.targetDepartment);

    const el = document.getElementById("catalog-explorer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("all");
  };

  const activeCategoryObj = selectedCategory !== "all" ? CATEGORY_TREE[selectedCategory] : null;

  return (
    <div style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif", minHeight: "100vh" }}>
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        user={user}
        setUser={setUser}
      />

      {/* Drawers & Modals */}
      <CartDrawer />
      <WishlistDrawer onQuickView={(p) => setQuickViewProduct(p)} />

      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          products={allProducts}
          onSelectProduct={(p) => setQuickViewProduct(p)}
        />
      )}

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <main className="pt-[72px]">
        {/* ── TOP STORY / CATEGORY BAR (AMAZON / MYNTRA STYLE) ──────────────── */}
        <section className="w-full bg-[#141414] border-b border-[#242424] px-4 sm:px-8 py-3.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-3 min-w-max mx-auto justify-start md:justify-center">
            {QUICK_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => handleStoryClick(story)}
                className="group flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-[#1e1e1e] transition-all cursor-pointer border border-transparent hover:border-[#333] text-left"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#2f2f2f] group-hover:border-[#f5c518] transition-all flex items-center justify-center bg-[#1a1a1a]">
                  <img
                    src={story.img}
                    alt={story.label}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
                  />
                  <span className="absolute bottom-0 right-0 bg-[#111]/90 text-xs px-1 rounded-full border border-[#444]">
                    {story.icon}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-[#e0e0e0] group-hover:text-[#f5c518] block whitespace-nowrap">
                    {story.label}
                  </span>
                  <span className="text-[9px] text-[#777] block font-medium">
                    {story.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── SMART BUYER HEADER / VIP HERO ────────────────────────────────── */}
        {user ? (
          <section className="w-full px-4 sm:px-8 py-6 bg-gradient-to-r from-[#17150c] via-[#141414] to-[#111111] border-b border-[#2a2a2a]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#f5c518] text-[#111]">
                    {user.role === "buyer" ? "VIP BUYER" : "SELLER ACCESS"}
                  </span>
                  <span className="text-xs text-[#9a9078]">
                    Welcome back, <strong className="text-white">{user.full_name || "Member"}</strong> 🔥
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Curated Drops For Your Street Style
                </h1>
              </div>

              {/* Quick Action Pills for Logged-In Buyers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate("/buyer/dashboard")}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded bg-[#1e1e1e] hover:bg-[#282828] text-white border border-[#333] hover:border-[#f5c518] transition-all flex items-center gap-1.5"
                >
                  <span>📦</span> My Orders & Details
                </button>
                <button
                  onClick={() => dispatch(openWishlist())}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded bg-[#1e1e1e] hover:bg-[#282828] text-white border border-[#333] hover:border-[#f5c518] transition-all flex items-center gap-1.5"
                >
                  <span>❤️</span> Saved Drops
                </button>
                <a
                  href="#catalog-explorer"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded bg-[#f5c518] hover:bg-[#e0b415] text-[#111] transition-all flex items-center gap-1.5 no-underline"
                >
                  <span>⚡</span> Browse All Drops
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="w-full px-4 sm:px-8 py-10 bg-gradient-to-b from-[#181818] to-[#111111] border-b border-[#2a2a2a]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-[#f5c518] mb-2">
                  SS 2025 Streetwear Marketplace
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  Dress to Impress. <span className="text-[#f5c518]">Built for the Streets.</span>
                </h1>
                <p className="text-sm text-[#9a9078]">
                  Direct drops from verified independent sellers across India. Zero counterfeits, pure hype.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="#catalog-explorer"
                  className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-[#f5c518] text-[#111] rounded hover:opacity-90 transition-opacity no-underline"
                >
                  Explore Drops →
                </a>
                <Link
                  to="/register"
                  className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-transparent border border-[#444] text-white hover:border-[#f5c518] hover:text-[#f5c518] rounded transition-all no-underline"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── CATEGORIZED SHELF 1: TRENDING FOOTWEAR ───────────────────────── */}
        {footwearProducts.length > 0 && (
          <CategorizedShelf
            title="Trending Footwear & Sneakers"
            subtitle="Low-tops, high-tops, retro runners, slides & loafers"
            badge="HOTTEST KICKS"
            icon="👟"
            products={footwearProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedCategory("footwear");
              document.getElementById("catalog-explorer")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* ── CATEGORIZED SHELF 2: STREETWEAR & APPAREL ─────────────────────── */}
        {apparelProducts.length > 0 && (
          <CategorizedShelf
            title="Fresh Streetwear & Apparel Drops"
            subtitle="Oversized heavy-cotton tees, graphic hoodies, cargos & denim"
            badge="NEW DROPS"
            icon="🔥"
            products={apparelProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedCategory("clothing");
              document.getElementById("catalog-explorer")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* ── CATEGORIZED SHELF 3: MEN & WOMEN CURATIONS ───────────────────── */}
        {menProducts.length > 0 && (
          <CategorizedShelf
            title="Men's Curated Edit"
            subtitle="Streetwear essentials, casual oversized fits & sneakers for Men"
            badge="MEN'S PICKS"
            icon="🕶️"
            products={menProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedDepartment("Men");
              document.getElementById("catalog-explorer")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {womenProducts.length > 0 && (
          <CategorizedShelf
            title="Women's Streetwear Edit"
            subtitle="Elevated aesthetics, cropped hoodies, statement denim & kicks"
            badge="WOMEN'S EDIT"
            icon="✨"
            products={womenProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedDepartment("Women");
              document.getElementById("catalog-explorer")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* ── INTERACTIVE FULL CATALOG EXPLORER (FLIPKART / AMAZON FILTERING) ─ */}
        <section id="catalog-explorer" className="w-full px-4 sm:px-8 py-12 border-b border-[#2a2a2a]">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-[#f5c518]">
                  Browse & Filter Storefront
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  All Marketplace Products
                </h2>
              </div>

              {/* Department Tabs */}
              <div className="flex items-center p-1 rounded-lg bg-[#181818] border border-[#2a2a2a]">
                <button
                  onClick={() => setSelectedDepartment("all")}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    selectedDepartment === "all"
                      ? "bg-[#f5c518] text-[#111] shadow-md font-extrabold"
                      : "text-[#888] hover:text-white"
                  }`}
                >
                  All Audience
                </button>
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                      selectedDepartment === dept.id
                        ? "bg-[#f5c518] text-[#111] shadow-md font-extrabold"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    <span>{dept.icon}</span>
                    <span>{dept.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => handleCategorySelect("all")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-[#f5c518] text-[#111] shadow-[0_0_12px_rgba(245,197,24,0.3)]"
                    : "bg-[#181818] text-[#888] border border-[#2a2a2a] hover:text-white hover:border-[#444]"
                }`}
              >
                All Categories
              </button>
              {Object.entries(CATEGORY_TREE).map(([catKey, catObj]) => (
                <button
                  key={catKey}
                  onClick={() => handleCategorySelect(catKey)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === catKey
                      ? "bg-[#f5c518] text-[#111] shadow-[0_0_12px_rgba(245,197,24,0.3)]"
                      : "bg-[#181818] text-[#888] border border-[#2a2a2a] hover:text-white hover:border-[#444]"
                  }`}
                >
                  <span>{catObj.icon}</span>
                  <span>{catObj.label}</span>
                </button>
              ))}
            </div>

            {/* Subcategory Filter Pills */}
            {activeCategoryObj?.subcategories && (
              <div className="p-3.5 rounded-lg bg-[#161616] border border-[#262626] flex flex-wrap items-center gap-2 animate-in fade-in">
                <span className="text-[11px] uppercase font-bold text-[#f5c518] mr-1">
                  Subcategory:
                </span>
                <button
                  onClick={() => setSelectedSubcategory("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    selectedSubcategory === "all"
                      ? "bg-[#f5c518] text-[#111] font-bold"
                      : "bg-[#202020] text-[#aaa] border border-[#333] hover:text-white"
                  }`}
                >
                  All {activeCategoryObj.label}
                </button>
                {activeCategoryObj.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      selectedSubcategory === sub.id
                        ? "bg-[#f5c518] text-[#111] font-bold"
                        : "bg-[#202020] text-[#aaa] border border-[#333] hover:text-white"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Live Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Filter by title, brand, tag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-[#f5c518] text-xs text-white px-3.5 py-2.5 pl-9 rounded-md outline-none"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777] pointer-events-none"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#777] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-[#888]">
                  Showing <strong className="text-white">{explorerProducts.length}</strong> items
                </span>

                <div className="flex items-center gap-2">
                  <label htmlFor="catalog-sort" className="text-xs text-[#888]">Sort:</label>
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#181818] border border-[#2a2a2a] text-xs text-[#e5e2e1] px-3 py-2 rounded-md outline-none cursor-pointer focus:border-[#f5c518]"
                  >
                    <option value="featured">Featured Drops</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="animate-pulse bg-[#1a1a1a] rounded-lg aspect-[3/4] border border-[#222]" />
              ))}
            </div>
          ) : explorerProducts.length === 0 ? (
            <div className="py-16 text-center bg-[#141414] rounded-lg border border-[#2a2a2a]">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-base font-bold text-white mb-1">No products found matching filters</p>
              <p className="text-xs text-[#888] mb-4">Try clearing category or search filters</p>
              <button
                onClick={() => {
                  setSelectedDepartment("all");
                  setSelectedCategory("all");
                  setSelectedSubcategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded bg-[#f5c518] text-[#111]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {explorerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── GUARANTEE FEATURES STRIP ─────────────────────────────────────── */}
        <section className="w-full px-4 sm:px-8 py-10 bg-[#141414] border-b border-[#2a2a2a]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-lg bg-[#181818] border border-[#262626] flex items-start gap-4">
                <div className="p-2.5 rounded bg-[#f5c518]/10 text-[#f5c518]">{f.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-[#9a9078] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SELLER BANNER (FOR GUESTS / PROSPECTIVE SELLERS) ─────────────── */}
        {(!user || user.role !== "seller") && (
          <section className="w-full px-4 sm:px-8 py-12 border-b border-[#2a2a2a]">
            <div className="max-w-7xl mx-auto rounded-xl bg-gradient-to-r from-[#f5c518] via-[#e5b710] to-[#f5c518] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[#111]">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#5c4600] mb-2">
                  Seller Hub Marketplace
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Got Heat to Sell? Join SNITCH Verified Sellers.
                </h2>
                <p className="text-sm font-medium text-[#423200] max-w-lg mt-1">
                  List streetwear drops, footwear, and apparel to thousands of buyers across India with zero upfront fees.
                </p>
              </div>
              <Link
                to="/register"
                className="px-8 py-3.5 bg-[#111] text-[#f5c518] hover:bg-[#222] font-black uppercase tracking-widest text-xs rounded transition-all whitespace-nowrap no-underline"
              >
                Become a Seller →
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="w-full px-4 sm:px-8 py-12 bg-[#0e0e0e] border-t border-[#222]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <span className="text-2xl font-black text-[#f5c518] tracking-tighter">SNITCH</span>
            <p className="text-xs text-[#9a9078] mt-2 leading-relaxed">
              The premier marketplace for authentic streetwear, sneakers, oversized apparel, and exclusive drops.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c518] mb-3">Shop</p>
              <div className="flex flex-col gap-2 text-xs text-[#9a9078]">
                <span>Footwear & Kicks</span>
                <span>Oversized Tees</span>
                <span>Hoodies & Sweats</span>
                <span>Cargo Pants</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c518] mb-3">Account</p>
              <div className="flex flex-col gap-2 text-xs text-[#9a9078]">
                <Link to="/login" className="text-[#9a9078] hover:text-white no-underline">Buyer Sign In</Link>
                <Link to="/register" className="text-[#9a9078] hover:text-white no-underline">Create Account</Link>
                <Link to="/seller/dashboard" className="text-[#9a9078] hover:text-white no-underline">Seller Portal</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f5c518] mb-3">Support</p>
              <div className="flex flex-col gap-2 text-xs text-[#9a9078]">
                <span>Buyer Protection</span>
                <span>Shipping Policy</span>
                <span>Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#555]">
          <p>© 2025 SNITCH PREMIUM MARKETPLACE. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
