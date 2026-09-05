import { Link, useNavigate } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPublicCatalog } from "../product/services/product.api";
import { addToCart, openCart } from "../cart/state/cart.slice";
import CartDrawer from "../cart/components/CartDrawer";
import { toggleWishlist, openWishlist } from "../wishlist/state/wishlist.slice";
import WishlistDrawer from "../wishlist/components/WishlistDrawer";

// ── Marketplace Categories (Amazon & Flipkart style) ───────────────────────────

const CATEGORIES = [
  {
    id: "clothing",
    label: "Clothing & Apparel",
    tag: "FASHION",
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
    icon: "👕",
  },
  {
    id: "electronics",
    label: "Electronics & Gadgets",
    tag: "TECH",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    icon: "💻",
  },
  {
    id: "footwear",
    label: "Footwear & Sneakers",
    tag: "KICKS",
    img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80",
    icon: "👟",
  },
  {
    id: "streetwear",
    label: "Streetwear Drops",
    tag: "EXCLUSIVE",
    img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    icon: "🔥",
  },
  {
    id: "accessories",
    label: "Accessories & Audio",
    tag: "GEAR",
    img: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=600&auto=format&fit=crop&q=80",
    icon: "🎧",
  },
  {
    id: "men",
    label: "Men's Collection",
    tag: "MEN",
    img: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
    icon: "🕶️",
  },
  {
    id: "women",
    label: "Women's Collection",
    tag: "WOMEN",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    icon: "✨",
  },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Exclusive Drops",
    desc: "Limited edition releases you won't find anywhere else. Be the first, every time.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: "Verified Sellers",
    desc: "Every seller is vetted. Every product is authenticated. Zero counterfeits.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Fast Delivery",
    desc: "Pan-India shipping with real-time tracking. Your order, at your door.",
  },
];

const STATS = [
  { value: "50K+", label: "Active Shoppers" },
  { value: "2,800+", label: "Verified Sellers" },
  { value: "120K+", label: "Products Listed" },
  { value: "4.9★", label: "Avg. Rating" },
];

// ── SearchOverlay ──────────────────────────────────────────────────────────────

function SearchOverlay({ onClose, products, onSelectProduct }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const searchData = [
    ...(products || []).map((p) => ({
      type: "product",
      id: p.id,
      slug: p.slug,
      label: p.title,
      sub: `₹${Number(p.price).toLocaleString("en-IN")} • ${p.seller?.store_name || "SNITCH Seller"}`,
      tag: p.tags?.[0] || null,
      cover: p.cover_image_url,
      raw: p,
    })),
    ...CATEGORIES.map((c) => ({
      type: "category",
      id: c.id,
      label: c.label,
      sub: "Browse category",
      tag: null,
      cover: null,
    })),
  ];

  const results = query.trim()
    ? searchData.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.sub && item.sub.toLowerCase().includes(query.toLowerCase()))
      )
    : searchData;

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
      aria-label="Search"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "96px",
        paddingLeft: "16px",
        paddingRight: "16px",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Search box */}
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="#5a5a5a"
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
            id="search-input"
            ref={inputRef}
            type="text"
            placeholder="Search products, brands, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "18px 12px",
              fontSize: "15px",
              color: "#e0e0e0",
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
                color: "#5a5a5a",
                padding: "4px",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <kbd
            style={{
              marginLeft: "8px",
              padding: "2px 7px",
              fontSize: "10px",
              color: "#4a4a4a",
              border: "1px solid #333",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
          {results.length === 0 ? (
            <p
              style={{
                padding: "24px 20px",
                fontSize: "13px",
                color: "#5a5a5a",
                textAlign: "center",
              }}
            >
              No results for &ldquo;
              <span style={{ color: "#9a9078" }}>{query}</span>
              &rdquo;
            </p>
          ) : (
            <>
              <p
                style={{
                  padding: "10px 20px 4px",
                  fontSize: "10px",
                  color: "#4a4a4a",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {query
                  ? `${results.length} result${results.length !== 1 ? "s" : ""}`
                  : "All items"}
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
                    padding: "11px 20px",
                    background: "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : "1px solid #1e1e1e",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#222")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {/* Thumbnail / Icon */}
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.label}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "6px",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #333",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "6px",
                        flexShrink: 0,
                        backgroundColor:
                          item.type === "product"
                            ? "#1e1e1e"
                            : "rgba(245,197,24,0.1)",
                        border: `1px solid ${
                          item.type === "product"
                            ? "#2a2a2a"
                            : "rgba(245,197,24,0.2)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.type === "product" ? (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="#9a9078"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="#f5c518"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      )}
                    </span>
                  )}

                  {/* Text */}
                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#e0e0e0",
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#5a5a5a",
                        marginTop: "1px",
                      }}
                    >
                      {item.sub}
                    </span>
                  </span>

                  {/* Tag / type badge */}
                  {item.tag ? (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        backgroundColor: "#f5c518",
                        color: "#111",
                        flexShrink: 0,
                      }}
                    >
                      {item.tag}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        border: "1px solid #2a2a2a",
                        color: "#4a4a4a",
                        borderRadius: "3px",
                        flexShrink: 0,
                      }}
                    >
                      {item.type === "product" ? "PRODUCT" : "CATEGORY"}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid #1e1e1e",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "10px", color: "#3a3a3a" }}>
            ↵ select &nbsp;·&nbsp; esc close
          </span>
          <span
            style={{ fontSize: "10px", color: "#3a3a3a", marginLeft: "auto" }}
          >
            ⌘K to open
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
  const isWishlisted = wishlistItems.some(
    (item) => item.productId === product?.id
  );
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
      aria-label="Product Details"
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
        {/* Close Button */}
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

          {/* Thumbnails */}
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
          {/* Seller / Brand */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#f5c518] bg-[#f5c518]/10 px-2 py-0.5 rounded border border-[#f5c518]/20">
              {product.seller?.store_name || "Verified Store"}
            </span>
            <span className="text-xs text-[#666] uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
            {product.title}
          </h2>

          {/* Price */}
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

          {/* Description */}
          {product.description && (
            <p className="text-sm text-[#9a9078] leading-relaxed mb-6 border-b border-[#222] pb-5">
              {product.description}
            </p>
          )}

          {/* Sizes */}
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

          {/* Colors */}
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

          {/* Quantity & Stock */}
          <div className="flex items-center gap-6 mb-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#888] block mb-2">
                Quantity
              </label>
              <div className="flex items-center border border-[#333] rounded bg-[#1e1e1e]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-[#aaa] hover:text-white"
                >
                  -
                </button>
                <span className="px-3 text-sm font-bold text-white">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="px-3 py-1.5 text-[#aaa] hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <span className="text-xs text-[#888] block mb-1">Availability</span>
              <span className="text-xs font-semibold text-emerald-400">
                {product.stock > 0 ? `In Stock (${product.stock} units)` : "Sold Out"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 rounded font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: added ? "#10b981" : "#f5c518",
                color: "#111111",
              }}
            >
              {added ? (
                <>✓ Added to Bag</>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                  </svg>
                  Add to Bag
                </>
              )}
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
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isWishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {isWishlisted ? "Saved" : "Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar({ onOpenSearch }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(null);

  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? false))
      .catch(() => setUser(false));
  }, []);

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
      className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-[72px]"
      style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="text-xl font-black tracking-tighter"
        style={{ color: "#f5c518", letterSpacing: "-0.03em" }}
      >
        SNITCH
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {["New Arrivals", "Collections", "Release Calendar"].map((item, i) => (
          <a
            key={item}
            href="#trending-section"
            className="text-sm font-medium transition-colors"
            style={{
              color: i === 0 ? "#f5c518" : "#9a9078",
              borderBottom: i === 0 ? "1px solid #f5c518" : "none",
              paddingBottom: i === 0 ? "2px" : "0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = i === 0 ? "#f5c518" : "#9a9078")
            }
          >
            {item}
          </a>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" style={{ color: "#f5c518" }}>
        {/* Search */}
        <button
          id="navbar-search"
          title="Search (⌘K)"
          className="p-2 rounded transition-colors"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          onClick={onOpenSearch}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>

        {/* Shopping Bag Drawer Trigger */}
        <button
          id="navbar-bag"
          title="Shopping Bag"
          onClick={() => dispatch(openCart())}
          className="p-2 rounded transition-colors relative"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>

        {/* Wishlist */}
        <button
          id="navbar-wishlist"
          title="Wishlist"
          onClick={() => dispatch(openWishlist())}
          className="p-2 rounded transition-colors relative"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {wishlistCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in">
              {wishlistCount > 99 ? "99+" : wishlistCount}
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

        {/* Account icon with dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            id="navbar-account"
            className="p-2 rounded transition-colors"
            style={{
              background: dropdownOpen ? "#1a1a1a" : "transparent",
              border: "none",
              cursor: "pointer",
              color: "#f5c518",
            }}
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={dropdownOpen}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
            onMouseLeave={(e) => {
              if (!dropdownOpen) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: "210px",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                zIndex: 100,
              }}
            >
              <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #2a2a2a" }}>
                {user ? (
                  <>
                    <p style={{ fontSize: "12px", color: "#e0e0e0", fontWeight: 600, marginBottom: "2px" }}>
                      {user.full_name}
                    </p>
                    <p style={{ fontSize: "10px", color: "#f5c518", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {user.role} account
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "10px", color: "#5a5a5a", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                    My Account
                  </p>
                )}
              </div>

              {user ? (
                <>
                  {user.role === "seller" ? (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/seller/dashboard");
                      }}
                      style={{
                        width: "100%", padding: "12px 16px", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500, textAlign: "left",
                        borderBottom: "1px solid #222",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      Seller Dashboard
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/buyer/dashboard");
                      }}
                      style={{
                        width: "100%", padding: "12px 16px", background: "transparent",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500, textAlign: "left",
                        borderBottom: "1px solid #222",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      My Account / Orders
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
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
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
                      gap: "10px", color: "#e0e0e0", fontSize: "13px", fontWeight: 500,
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

        {/* Join button — hidden when already logged in */}
        {!user && (
          <Link
            to="/register"
            className="ml-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-opacity"
            style={{
              backgroundColor: "#f5c518",
              color: "#111111",
              textDecoration: "none",
              letterSpacing: "0.1em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
      className="group flex flex-col cursor-pointer transition-all duration-300 rounded overflow-hidden relative"
      style={{ border: "1px solid #2a2a2a", backgroundColor: "#161616" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5c518")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
    >
      {/* Image area */}
      <div
        className="relative w-full aspect-square flex items-center justify-center overflow-hidden bg-[#1a1a1a]"
      >
        {/* Cover image */}
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.18">
            <rect x="8" y="14" width="48" height="36" rx="2" stroke="#f5c518" strokeWidth="2"/>
            <circle cx="32" cy="32" r="10" stroke="#f5c518" strokeWidth="2"/>
          </svg>
        )}

        {/* Tag badge */}
        {product.tags?.[0] && (
          <span
            className="absolute top-3 left-3 text-[10px] font-extrabold px-2 py-0.5 tracking-widest uppercase z-10"
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
              top: product.tags?.[0] ? "34px" : "12px",
              left: "12px",
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
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[#111111]/80 hover:bg-[#111111] border border-[#333] hover:border-[#f5c518] shadow-md backdrop-blur-sm"
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
            className="transition-transform active:scale-75"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Hover Action Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-2"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView(product);
            }}
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded shadow-lg bg-[#222] hover:bg-[#333] text-white border border-[#444] transition-all transform translate-y-2 group-hover:translate-y-0"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
        <div>
          {product.seller?.store_name && (
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#9a9078] mb-1">
              {product.seller.store_name}
            </p>
          )}
          <h4 className="text-sm font-semibold text-[#e5e2e1] line-clamp-1 group-hover:text-[#f5c518] transition-colors">
            {product.title}
          </h4>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-[#f5c518]">
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const data = await getPublicCatalog();
        if (data && data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filtered products by category tab
  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );

  return (
    <div style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif" }}>
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Global Shopping Bag Drawer */}
      <CartDrawer />

      {/* Global Wishlist Drawer */}
      <WishlistDrawer onQuickView={(p) => setQuickViewProduct(p)} />

      {/* Global Search Overlay */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          products={products}
          onSelectProduct={(p) => setQuickViewProduct(p)}
        />
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <main className="pt-[72px]">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          className="w-full px-8 flex flex-col justify-center"
          style={{
            minHeight: "88vh",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <div style={{ maxWidth: "760px" }}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-6"
              style={{ color: "#f5c518", letterSpacing: "0.18em" }}
            >
              SS 2025 Collection
            </p>
            <h1
              className="font-black leading-none mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", letterSpacing: "-0.04em", color: "#ffffff" }}
            >
              Dress to Impress.{" "}
              <span style={{ color: "#f5c518" }}>Built for</span>
              {" "}the Streets.
            </h1>
            <p
              className="text-lg mb-10 leading-relaxed"
              style={{ color: "#9a9078", maxWidth: "480px" }}
            >
              The definitive marketplace for premium streetwear and exclusive drops from verified independent sellers.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#trending-section"
                className="text-xs font-bold uppercase tracking-widest px-10 py-4 transition-opacity"
                style={{ backgroundColor: "#f5c518", color: "#111111", letterSpacing: "0.12em", border: "none", cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Explore Drops
              </a>
              <Link
                to="/register"
                className="text-xs font-bold uppercase tracking-widest px-10 py-4 transition-colors"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ffffff",
                  color: "#ffffff",
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f5c518";
                  e.currentTarget.style.color = "#f5c518";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#ffffff";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────────────── */}
        <section
          className="w-full px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{ backgroundColor: "#161616", borderBottom: "1px solid #2a2a2a" }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-3xl font-black" style={{ color: "#f5c518", letterSpacing: "-0.03em" }}>
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-widest" style={{ color: "#9a9078" }}>
                {s.label}
              </span>
            </div>
          ))}
        </section>

        {/* ── FEATURED CATEGORIES ──────────────────────────────────────────── */}
        <section className="w-full px-8 py-20" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex items-end justify-between mb-10">
            <h2
              className="font-bold"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.03em", color: "#ffffff" }}
            >
              Featured Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  document.getElementById("trending-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative h-64 cursor-pointer overflow-hidden group rounded"
                style={{ border: "1px solid #2a2a2a" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5c518")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.8, transition: "transform 0.5s ease, opacity 0.3s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "0.8"; }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-4"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
                >
                  <h3 className="text-lg font-bold" style={{ color: "#ffffff" }}>{cat.label}</h3>
                  <p className="text-xs text-[#f5c518] mt-0.5 font-medium">Browse Collection →</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE PRODUCT CATALOG ─────────────────────────────────────────── */}
        <section id="trending-section" className="w-full px-8 py-20" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c518" }}>
                Live Marketplace Drops
              </p>
              <h2
                className="font-bold"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.03em", color: "#ffffff" }}
              >
                Latest Seller Products
              </h2>
            </div>

            {/* Category Filter Pills (Amazon & Flipkart style) */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Drops" },
                { id: "clothing", label: "👕 Clothing" },
                { id: "electronics", label: "💻 Electronics" },
                { id: "footwear", label: "👟 Footwear" },
                { id: "accessories", label: "🎧 Accessories" },
                { id: "streetwear", label: "🔥 Streetwear" },
                { id: "men", label: "Men" },
                { id: "women", label: "Women" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#f5c518] text-[#111] shadow-[0_0_12px_rgba(245,197,24,0.3)]"
                      : "bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:text-white hover:border-[#444]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse flex flex-col gap-3">
                  <div className="w-full aspect-square bg-[#1e1e1e] rounded" />
                  <div className="h-4 bg-[#222] rounded w-3/4" />
                  <div className="h-4 bg-[#222] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#2a2a2a] rounded-lg">
              <p className="text-lg font-bold text-[#888] mb-2">No products found in this category</p>
              <p className="text-sm text-[#555]">Check back soon or switch categories to explore other drops.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── WHY SNITCH ───────────────────────────────────────────────────── */}
        <section
          className="w-full px-8 py-20"
          style={{ backgroundColor: "#161616", borderBottom: "1px solid #2a2a2a" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#f5c518" }}>
            Why Choose Us
          </p>
          <h2
            className="font-bold mb-14"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.03em", color: "#ffffff" }}
          >
            The SNITCH Standard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ border: "1px solid #2a2a2a" }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="p-10 flex flex-col gap-5"
                style={{
                  borderRight: i < FEATURES.length - 1 ? "1px solid #2a2a2a" : "none",
                }}
              >
                <div>{f.icon}</div>
                <h3 className="text-lg font-bold" style={{ color: "#e5e2e1" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9a9078" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BECOME A SELLER CTA ──────────────────────────────────────────── */}
        <section className="w-full px-8 py-20" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div
            className="w-full flex flex-col md:flex-row items-center justify-between gap-8 px-12 py-16"
            style={{ backgroundColor: "#f5c518" }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#695200", letterSpacing: "0.15em" }}
              >
                For Sellers
              </p>
              <h2
                className="font-black mb-3"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.03em", color: "#111111" }}
              >
                Turn Your Style Into a Business.
              </h2>
              <p className="text-base" style={{ color: "#3d2f00", maxWidth: "420px" }}>
                Join thousands of verified sellers reaching premium buyers across India. Zero listing fees to start.
              </p>
            </div>
            <Link
              to="/register"
              className="flex-shrink-0 text-xs font-black uppercase tracking-widest px-10 py-4 transition-opacity"
              style={{
                backgroundColor: "#111111",
                color: "#f5c518",
                textDecoration: "none",
                letterSpacing: "0.12em",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Join as a Seller →
            </Link>
          </div>
        </section>

        {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
        <section
          className="w-full px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: "#ffffff" }}>
              Get First Access to Exclusive Drops
            </h3>
            <p className="text-sm" style={{ color: "#9a9078" }}>
              Subscribe and never miss a limited release.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-0 w-full md:w-auto"
            style={{ maxWidth: "420px" }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="snitch-input"
              style={{ borderRadius: "0", flex: 1 }}
            />
            <button
              type="submit"
              className="text-xs font-bold uppercase tracking-widest px-6 flex-shrink-0 transition-opacity"
              style={{
                backgroundColor: "#f5c518",
                color: "#111111",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "#0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Subscribe
            </button>
          </form>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer
        className="w-full px-8 py-14 flex flex-col md:flex-row items-start justify-between gap-10"
        style={{ backgroundColor: "#0e0e0e", borderTop: "1px solid #2a2a2a" }}
      >
        <div className="flex flex-col gap-3" style={{ maxWidth: "260px" }}>
          <span
            className="text-2xl font-black tracking-tighter"
            style={{ color: "#f5c518", letterSpacing: "-0.03em" }}
          >
            SNITCH
          </span>
          <p className="text-xs leading-relaxed" style={{ color: "#9a9078" }}>
            The definitive marketplace for premium streetwear and exclusive drops.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {[
            { heading: "Marketplace", links: ["New Arrivals", "Collections", "Release Calendar", "Brands"] },
            { heading: "Sell", links: ["Become a Seller", "Seller Dashboard", "Listing Guide", "Seller FAQ"] },
            { heading: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
          ].map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#f5c518", letterSpacing: "0.12em" }}>
                {col.heading}
              </p>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm transition-colors"
                  style={{ color: "#9a9078", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e2e1")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </footer>

      {/* Footer bottom bar */}
      <div
        className="w-full px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ backgroundColor: "#0e0e0e", borderTop: "1px solid #1a1a1a" }}
      >
        <p className="text-xs" style={{ color: "#4e4633" }}>
          © 2025 SNITCH PREMIUM MARKETPLACE. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-6">
          {["Terms of Service", "Privacy Policy", "Shipping Info", "Returns"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-xs transition-colors"
              style={{ color: "#4e4633", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#9a9078")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4e4633")}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
