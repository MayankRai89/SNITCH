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

// ── Smart Synonym & Query Expander ─────────────────────────────────────────────
const SYNONYMS = {
  shoes: ["footwear", "sneakers", "kicks", "loafers", "slides", "shoes", "shoe"],
  shoe: ["footwear", "sneakers", "kicks", "loafers", "slides", "shoes", "shoe"],
  sneaker: ["footwear", "sneakers", "kicks", "shoes", "shoe"],
  sneakers: ["footwear", "sneakers", "kicks", "shoes", "shoe"],
  kicks: ["footwear", "sneakers", "shoes"],
  tee: ["clothing", "t-shirts", "t-shirt", "tshirts", "oversized", "tee", "tees"],
  tees: ["clothing", "t-shirts", "t-shirt", "tshirts", "oversized", "tee", "tees"],
  tshirt: ["clothing", "t-shirts", "t-shirt", "tshirts", "tee", "tees"],
  "t-shirt": ["clothing", "t-shirts", "t-shirt", "tshirts", "tee", "tees"],
  shirt: ["clothing", "shirts", "t-shirts", "t-shirt", "tee"],
  hoodie: ["streetwear", "hoodies", "sweatshirt", "jacket", "hoodie", "hoodies"],
  hoodies: ["streetwear", "hoodies", "sweatshirt", "jacket", "hoodie", "hoodies"],
  jacket: ["streetwear", "jackets", "bomber", "windbreaker", "jacket"],
  jackets: ["streetwear", "jackets", "bomber", "windbreaker", "jacket"],
  cargo: ["clothing", "cargos", "pants", "parachutes", "cargo"],
  cargos: ["clothing", "cargos", "pants", "parachutes", "cargo"],
  pant: ["clothing", "pants", "cargos", "jeans", "denim", "trousers"],
  pants: ["clothing", "pants", "cargos", "jeans", "denim", "trousers"],
  jeans: ["clothing", "jeans", "denim", "pants"],
  denim: ["clothing", "jeans", "denim", "pants", "jackets"],
  men: ["Men", "men", "male", "boys", "boy"],
  mens: ["Men", "men", "male", "boys", "boy"],
  women: ["Women", "women", "female", "girls", "girl", "crop"],
  womens: ["Women", "women", "female", "girls", "girl", "crop"],
  tech: ["electronics", "gadgets", "audio", "earbuds", "watch"],
  audio: ["electronics", "accessories", "headphones", "earbuds", "speakers"],
  accessories: ["accessories", "chains", "caps", "wallets", "belts", "bags"],
};

// Popular trending search recommendations
const TRENDING_SEARCHES = [
  "Chunky Sneakers",
  "Oversized Acid Wash Tee",
  "Heavyweight Hoodie",
  "Parachute Cargos",
  "Retro Dunks",
  "Men's Streetwear",
  "Women's Crop Hoodies",
];

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
    sub: "Graphic & Heavy",
    tag: "DROP",
    icon: "👕",
    targetCategory: "clothing",
    targetSubcategory: "t-shirts",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "streetwear-hoodies",
    label: "Hoodies & Sweats",
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
    sub: "Baggy & Parachute",
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
    title: "100% Verified Streetwear",
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

// ── Smart Multi-Field Product Search Scorer ────────────────────────────────────
function scoreProductMatch(product, queryWords) {
  if (!queryWords || queryWords.length === 0) return 1;

  let totalScore = 0;
  const title = (product.title || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const subcat = (product.subcategory || "").toLowerCase();
  const gender = (product.gender || "").toLowerCase();
  const store = (product.seller?.store_name || "").toLowerCase();
  const tags = (product.tags || []).map((t) => t.toLowerCase());
  const colors = (product.colors || []).map((c) => c.toLowerCase());

  for (const rawWord of queryWords) {
    const word = rawWord.toLowerCase();
    const syns = SYNONYMS[word] || [word];

    let wordMatched = false;

    // Check title (highest weight)
    if (title.includes(word)) {
      totalScore += title.startsWith(word) ? 40 : 25;
      wordMatched = true;
    }

    // Check category / subcategory
    if (cat.includes(word) || subcat.includes(word)) {
      totalScore += 20;
      wordMatched = true;
    }

    // Check synonyms against category, subcategory, title
    for (const s of syns) {
      if (cat.includes(s) || subcat.includes(s) || title.includes(s)) {
        totalScore += 15;
        wordMatched = true;
        break;
      }
    }

    // Check gender
    if (gender === word || syns.includes(gender)) {
      totalScore += 15;
      wordMatched = true;
    }

    // Check tags & colors
    if (tags.some((t) => t.includes(word)) || colors.some((c) => c.includes(word))) {
      totalScore += 12;
      wordMatched = true;
    }

    // Check seller store name
    if (store.includes(word)) {
      totalScore += 10;
      wordMatched = true;
    }

    // Check description
    if (desc.includes(word)) {
      totalScore += 5;
      wordMatched = true;
    }

    if (!wordMatched) {
      // If any word has no match anywhere, penalty
      return 0;
    }
  }

  return totalScore;
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

// ── Shelf Section ──────────────────────────────────────────────────────────────

function CategorizedShelf({ title, subtitle, badge, icon, products, onQuickView, onExploreCategory }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-8 py-8 border-b border-[#222222]">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.slice(0, 5).map((p) => (
          <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
}

// ── Smart Navbar with Integrated Interactive Search & Rich Dropdown ───────────

function Navbar({
  user,
  setUser,
  allProducts,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onExecuteSearch,
  onSelectProduct,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("snitch_recent_searches") || "[]");
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const wishlistCount = wishlistItems.length;

  const isSeller = user && user.role === "seller";

  // Real-time matching suggestions from allProducts
  const liveMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const scored = allProducts
      .map((p) => ({
        product: p,
        score: scoreProductMatch(p, words),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5).map((item) => item.product);
  }, [allProducts, searchQuery]);

  // Save query to recent searches
  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("snitch_recent_searches", JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
  };

  const removeRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem("snitch_recent_searches", JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    setSearchFocused(false);
    onExecuteSearch(searchQuery.trim());
  };

  const handleSelectRecentOrTrending = (term) => {
    setSearchQuery(term);
    saveRecentSearch(term);
    setSearchFocused(false);
    onExecuteSearch(term);
  };

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="fixed top-0 w-full z-50 flex items-center justify-between px-3 sm:px-8 h-[72px]"
      style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter flex items-center gap-1.5"
          style={{ color: "#f5c518", letterSpacing: "-0.04em", textDecoration: "none" }}
        >
          <span>SNITCH</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30 hidden md:inline-block">
            STREETWEAR
          </span>
        </Link>
      </div>

      {/* Center: Live Flipkart / Amazon Style Search Box & Auto-Suggest */}
      <div ref={searchContainerRef} className="flex-1 max-w-2xl mx-3 sm:mx-6 relative">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full flex items-center bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] focus-within:border-[#f5c518] focus-within:ring-1 focus-within:ring-[#f5c518]/50 transition-all overflow-hidden"
        >
          {/* Category Scope Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="hidden lg:block bg-[#141414] text-[#9a9078] hover:text-white text-xs font-semibold px-3 py-2.5 border-r border-[#2a2a2a] outline-none cursor-pointer"
          >
            <option value="all">All Drops</option>
            <option value="footwear">👟 Footwear</option>
            <option value="clothing">👕 Clothing</option>
            <option value="streetwear">🔥 Streetwear</option>
            <option value="electronics">💻 Tech</option>
            <option value="accessories">🎧 Accessories</option>
          </select>

          {/* Real-time Search Input */}
          <div className="flex-1 flex items-center px-3 py-1.5">
            <svg
              className="text-[#888] flex-shrink-0 mr-2"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search footwear, oversized tees, hoodies, cargos…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-[#666]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  onExecuteSearch("");
                }}
                className="text-xs text-[#777] hover:text-white px-1.5 py-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#f5c518] hover:bg-[#e0b415] text-[#111] font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center flex-shrink-0"
          >
            <span className="hidden sm:inline">Search</span>
            <svg className="sm:hidden" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* ── Auto-Suggest Floating Dropdown (Amazon / Flipkart UI) ───────────── */}
        {searchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden text-xs divide-y divide-[#202020] animate-in fade-in slide-in-from-top-2">
            
            {/* Live Product Matches */}
            {searchQuery.trim() && liveMatches.length > 0 && (
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#f5c518] mb-2">
                  Matching Products ({liveMatches.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {liveMatches.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSearchFocused(false);
                        saveRecentSearch(searchQuery);
                        onSelectProduct(p);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#202020] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          className="w-9 h-9 rounded object-cover border border-[#333]"
                        />
                        <div>
                          <p className="font-semibold text-white group-hover:text-[#f5c518] line-clamp-1">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-[#888]">
                            {p.seller?.store_name || "SNITCH Seller"} • {p.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-[#f5c518]">
                          ₹{Number(p.price).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full mt-2 py-2 text-center text-xs font-bold text-[#f5c518] hover:bg-[#222] rounded transition-colors"
                >
                  View all results for &ldquo;{searchQuery}&rdquo; →
                </button>
              </div>
            )}

            {/* If Query entered but no exact product match */}
            {searchQuery.trim() && liveMatches.length === 0 && (
              <div className="p-4 text-center text-[#888]">
                <p>Press Enter to search entire catalog for &ldquo;<strong className="text-white">{searchQuery}</strong>&rdquo;</p>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("snitch_recent_searches");
                    }}
                    className="text-[10px] text-[#666] hover:text-[#f5c518]"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleSelectRecentOrTrending(term)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202020] hover:bg-[#282828] text-white cursor-pointer border border-[#333] transition-colors"
                    >
                      <span>🕒 {term}</span>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, term)}
                        className="text-[#777] hover:text-white ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Hot Searches */}
            <div className="p-3 bg-[#131313]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#888] block mb-2">
                🔥 Trending Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectRecentOrTrending(term)}
                    className="px-2.5 py-1 rounded-full bg-[#1b1b1b] hover:bg-[#f5c518] hover:text-[#111] text-[#ccc] border border-[#2f2f2f] transition-all cursor-pointer text-[11px] font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" style={{ color: "#f5c518" }}>
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

        {/* Shopping Bag */}
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
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30 hover:bg-[#f5c518] hover:text-[#111] transition-all ml-1 hidden sm:inline-block"
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
  const [priceFilter, setPriceFilter] = useState("all");
  const [discountOnly, setDiscountOnly] = useState(false);

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

  // Filtered explorer products with Smart Scorer
  const explorerProducts = useMemo(() => {
    let list = [...allProducts];

    // 1. Department Filter
    if (selectedDepartment !== "all") {
      list = list.filter((p) => (p.gender || "").toLowerCase() === selectedDepartment.toLowerCase());
    }

    // 2. Category Filter
    if (selectedCategory !== "all") {
      list = list.filter((p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Subcategory Filter
    if (selectedSubcategory !== "all") {
      list = list.filter((p) => (p.subcategory || "").toLowerCase() === selectedSubcategory.toLowerCase());
    }

    // 4. Price Bracket Filter
    if (priceFilter === "under-1500") {
      list = list.filter((p) => Number(p.price) < 1500);
    } else if (priceFilter === "1500-3000") {
      list = list.filter((p) => Number(p.price) >= 1500 && Number(p.price) <= 3000);
    } else if (priceFilter === "3000-6000") {
      list = list.filter((p) => Number(p.price) >= 3000 && Number(p.price) <= 6000);
    } else if (priceFilter === "above-6000") {
      list = list.filter((p) => Number(p.price) > 6000);
    }

    // 5. Discount Only Filter
    if (discountOnly) {
      list = list.filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));
    }

    // 6. Smart Multi-Word & Synonym Search
    if (searchQuery.trim()) {
      const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const scoredItems = list
        .map((p) => ({
          product: p,
          score: scoreProductMatch(p, words),
        }))
        .filter((item) => item.score > 0);

      // If user sorted by "featured", sort by search relevance score
      if (sortBy === "featured") {
        scoredItems.sort((a, b) => b.score - a.score);
      }
      list = scoredItems.map((item) => item.product);
    }

    // 7. Sort options
    if (sortBy === "price-low") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [allProducts, selectedDepartment, selectedCategory, selectedSubcategory, priceFilter, discountOnly, searchQuery, sortBy]);

  // Scroll smoothly to catalog explorer
  const scrollToCatalog = () => {
    const el = document.getElementById("catalog-explorer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStoryClick = (story) => {
    if (story.targetCategory) setSelectedCategory(story.targetCategory);
    if (story.targetSubcategory) setSelectedSubcategory(story.targetSubcategory);
    if (story.targetDepartment) setSelectedDepartment(story.targetDepartment);
    scrollToCatalog();
  };

  const handleExecuteSearch = (term) => {
    setSearchQuery(term);
    scrollToCatalog();
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory("all");
  };

  const resetAllFilters = () => {
    setSelectedDepartment("all");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSearchQuery("");
    setPriceFilter("all");
    setDiscountOnly(false);
    setSortBy("featured");
  };

  const activeCategoryObj = selectedCategory !== "all" ? CATEGORY_TREE[selectedCategory] : null;

  return (
    <div style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif", minHeight: "100vh" }}>
      {/* Smart Navbar with integrated live autocomplete search */}
      <Navbar
        user={user}
        setUser={setUser}
        allProducts={allProducts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onExecuteSearch={handleExecuteSearch}
        onSelectProduct={(p) => setQuickViewProduct(p)}
      />

      {/* Drawers & Modals */}
      <CartDrawer />
      <WishlistDrawer onQuickView={(p) => setQuickViewProduct(p)} />

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

              {/* Quick Action Pills */}
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
                <button
                  onClick={scrollToCatalog}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded bg-[#f5c518] hover:bg-[#e0b415] text-[#111] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⚡</span> Browse All Drops
                </button>
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
                <button
                  onClick={scrollToCatalog}
                  className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-[#f5c518] text-[#111] rounded hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  Explore Drops →
                </button>
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
        {!searchQuery.trim() && footwearProducts.length > 0 && (
          <CategorizedShelf
            title="Trending Footwear & Sneakers"
            subtitle="Low-tops, high-tops, retro runners, slides & loafers"
            badge="HOTTEST KICKS"
            icon="👟"
            products={footwearProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedCategory("footwear");
              scrollToCatalog();
            }}
          />
        )}

        {/* ── CATEGORIZED SHELF 2: STREETWEAR & APPAREL ─────────────────────── */}
        {!searchQuery.trim() && apparelProducts.length > 0 && (
          <CategorizedShelf
            title="Fresh Streetwear & Apparel Drops"
            subtitle="Oversized heavy-cotton tees, graphic hoodies, cargos & denim"
            badge="NEW DROPS"
            icon="🔥"
            products={apparelProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedCategory("clothing");
              scrollToCatalog();
            }}
          />
        )}

        {/* ── CATEGORIZED SHELF 3: MEN & WOMEN CURATIONS ───────────────────── */}
        {!searchQuery.trim() && menProducts.length > 0 && (
          <CategorizedShelf
            title="Men's Curated Edit"
            subtitle="Streetwear essentials, casual oversized fits & sneakers for Men"
            badge="MEN'S PICKS"
            icon="🕶️"
            products={menProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedDepartment("Men");
              scrollToCatalog();
            }}
          />
        )}

        {!searchQuery.trim() && womenProducts.length > 0 && (
          <CategorizedShelf
            title="Women's Streetwear Edit"
            subtitle="Elevated aesthetics, cropped hoodies, statement denim & kicks"
            badge="WOMEN'S EDIT"
            icon="✨"
            products={womenProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            onExploreCategory={() => {
              setSelectedDepartment("Women");
              scrollToCatalog();
            }}
          />
        )}

        {/* ── INTERACTIVE FULL CATALOG EXPLORER & ADVANCED SEARCH ───────────── */}
        <section id="catalog-explorer" className="w-full px-4 sm:px-8 py-12 border-b border-[#2a2a2a]">
          <div className="flex flex-col gap-6 mb-8">
            
            {/* Search Active Indicator / Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#f5c518]">
                    {searchQuery.trim() ? "Search Results" : "Live Storefront"}
                  </span>
                  {searchQuery.trim() && (
                    <span className="text-xs text-[#888]">
                      for &ldquo;<strong className="text-white">{searchQuery}</strong>&rdquo;
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{searchQuery.trim() ? `Found ${explorerProducts.length} Products` : "All Marketplace Products"}</span>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-[#f5c518] hover:underline font-semibold"
                    >
                      Clear Search ✕
                    </button>
                  )}
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

            {/* Category Filter Pills */}
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

            {/* Price Brackets, Discount Toggle & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-[#161616] p-3 rounded-lg border border-[#222]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#888] font-semibold">Price:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "under-1500", label: "Under ₹1,500" },
                  { id: "1500-3000", label: "₹1,500 - ₹3,000" },
                  { id: "3000-6000", label: "₹3,000 - ₹6,000" },
                  { id: "above-6000", label: "₹6,000+" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriceFilter(p.id)}
                    className={`px-2.5 py-1 text-xs rounded transition-all ${
                      priceFilter === p.id
                        ? "bg-[#f5c518] text-[#111] font-bold"
                        : "bg-[#202020] text-[#888] hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                <button
                  onClick={() => setDiscountOnly(!discountOnly)}
                  className={`px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                    discountOnly
                      ? "bg-red-600 text-white font-bold"
                      : "bg-[#202020] text-[#888] hover:text-white"
                  }`}
                >
                  <span>🏷️</span> On Sale
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="catalog-sort" className="text-xs text-[#888] font-semibold">Sort:</label>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#333] text-xs text-[#e5e2e1] px-3 py-1.5 rounded-md outline-none cursor-pointer focus:border-[#f5c518]"
                >
                  <option value="featured">Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
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
            <div className="py-16 text-center bg-[#141414] rounded-xl border border-[#2a2a2a] max-w-2xl mx-auto p-8">
              <span className="text-5xl mb-4 block">🔍</span>
              <h3 className="text-lg font-bold text-white mb-2">
                No matching products found for &ldquo;<span className="text-[#f5c518]">{searchQuery || "selected filters"}</span>&rdquo;
              </h3>
              <p className="text-xs text-[#9a9078] mb-6 max-w-md mx-auto">
                Try searching for broader terms like <strong>sneakers</strong>, <strong>oversized tee</strong>, <strong>hoodie</strong>, or <strong>cargos</strong>.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded bg-[#f5c518] text-[#111] hover:bg-[#e0b415] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
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

        {/* ── SELLER BANNER ────────────────────────────────────────────────── */}
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
