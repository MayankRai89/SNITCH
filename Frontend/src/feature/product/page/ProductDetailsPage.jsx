import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getProductBySlug, getPublicCatalog } from "../services/product.api";
import { addToCart, addToCartServer, openCart } from "../../cart/state/cart.slice";
import { toggleWishlist, openWishlist } from "../../wishlist/state/wishlist.slice";
import CartDrawer from "../../cart/components/CartDrawer";
import WishlistDrawer from "../../wishlist/components/WishlistDrawer";
import { resolveVariant } from "../utils/variantResolver";
import {
  DEPARTMENTS,
  CATEGORY_TREE,
  formatCategoryName,
  formatSubcategoryName,
} from "../utils/categoryHierarchy";

// ── Size Chart Modal ──────────────────────────────────────────────────────────

function SizeChartModal({ category, onClose }) {
  const isShoes = (category || "").toLowerCase().includes("shoes") || (category || "").toLowerCase().includes("footwear");
  
  return (
    <div
      role="dialog"
      aria-label="Size Chart"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 shadow-2xl relative text-[#e5e2e1]">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" fill="none" stroke="#f5c518" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              {isShoes ? "Footwear Size Guide (UK / EU / CM)" : "Streetwear Size Guide (Inches)"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] text-[#9a9078] hover:text-white flex items-center justify-center transition-colors border border-[#333]"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#9a9078] mb-4">
          {isShoes
            ? "Indian/UK shoe sizing standards. Measure from heel to longest toe."
            : "All measurements are in inches. Designed for an authentic streetwear, comfortable drape."}
        </p>

        <div className="overflow-x-auto">
          {isShoes ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1f1f1f] text-[#f5c518] uppercase tracking-wider border border-[#333]">
                  <th className="p-2.5 font-bold">UK / India</th>
                  <th className="p-2.5 font-bold">US Size</th>
                  <th className="p-2.5 font-bold">EU Size</th>
                  <th className="p-2.5 font-bold">Foot Length (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a] text-[#ccc]">
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 6</td>
                  <td className="p-2.5">7</td>
                  <td className="p-2.5">40</td>
                  <td className="p-2.5">25.0 cm</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 7</td>
                  <td className="p-2.5">8</td>
                  <td className="p-2.5">41</td>
                  <td className="p-2.5">25.8 cm</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 8</td>
                  <td className="p-2.5">9</td>
                  <td className="p-2.5">42</td>
                  <td className="p-2.5">26.6 cm</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 9</td>
                  <td className="p-2.5">10</td>
                  <td className="p-2.5">43</td>
                  <td className="p-2.5">27.5 cm</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 10</td>
                  <td className="p-2.5">11</td>
                  <td className="p-2.5">44</td>
                  <td className="p-2.5">28.3 cm</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">UK 11</td>
                  <td className="p-2.5">12</td>
                  <td className="p-2.5">45</td>
                  <td className="p-2.5">29.1 cm</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1f1f1f] text-[#f5c518] uppercase tracking-wider border border-[#333]">
                  <th className="p-2.5 font-bold">Size</th>
                  <th className="p-2.5 font-bold">Chest (in)</th>
                  <th className="p-2.5 font-bold">Length (in)</th>
                  <th className="p-2.5 font-bold">Shoulder (in)</th>
                  <th className="p-2.5 font-bold">Sleeve (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a] text-[#ccc]">
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">S</td>
                  <td className="p-2.5">38 - 40</td>
                  <td className="p-2.5">27.5</td>
                  <td className="p-2.5">18.5</td>
                  <td className="p-2.5">8.5</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">M</td>
                  <td className="p-2.5">40 - 42</td>
                  <td className="p-2.5">28.5</td>
                  <td className="p-2.5">19.5</td>
                  <td className="p-2.5">9.0</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">L</td>
                  <td className="p-2.5">42 - 44</td>
                  <td className="p-2.5">29.5</td>
                  <td className="p-2.5">20.5</td>
                  <td className="p-2.5">9.5</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">XL</td>
                  <td className="p-2.5">44 - 46</td>
                  <td className="p-2.5">30.5</td>
                  <td className="p-2.5">21.5</td>
                  <td className="p-2.5">10.0</td>
                </tr>
                <tr className="hover:bg-[#1c1c1c]">
                  <td className="p-2.5 font-bold text-white">XXL</td>
                  <td className="p-2.5">46 - 48</td>
                  <td className="p-2.5">31.5</td>
                  <td className="p-2.5">22.5</td>
                  <td className="p-2.5">10.5</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 p-3 rounded bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-3 text-xs text-[#888]">
          <span className="text-emerald-400 font-bold">Tip:</span> If you are between sizes, choose one size up for a relaxed, comfortable fit.
        </div>
      </div>
    </div>
  );
}

// ── Main Product Details Page ─────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Customization state
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Pincode checker state
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Wishlist & Cart state
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const isWishlisted = product ? wishlistItems.some((item) => item.productId === product.id) : false;
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  // Active User check
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? false))
      .catch(() => setUser(false));
  }, []);

  // Fetch product data
  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getProductBySlug(slug);
        if (data && data.product) {
          setProduct(data.product);
          setSelectedSize(data.product.sizes?.[0] || "M");
          setSelectedColor(data.product.colors?.[0] || "");
          setActiveImageIndex(0);

          // Fetch related products from public catalog
          try {
            const catalogData = await getPublicCatalog();
            if (catalogData && catalogData.products) {
              setRelatedProducts(
                catalogData.products
                  .filter((p) => p.id !== data.product.id)
                  .slice(0, 4)
              );
            }
          } catch {
            // Ignore related errors
          }
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("Unable to load product. It may have been removed or is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#e5e2e1] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#f5c518] rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#9a9078]">Loading Drop...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#e5e2e1] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6 text-[#f5c518]">
          <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Drop Not Found</h2>
        <p className="text-sm text-[#9a9078] max-w-md mb-6">{error || "This piece is no longer available in the catalogue."}</p>
        <Link
          to="/"
          className="px-8 py-3 bg-[#f5c518] text-[#111] font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  // Combine cover image and gallery images
  const allImages = [
    product.cover_image_url,
    ...(product.images || []).filter((img) => img !== product.cover_image_url),
  ].filter(Boolean);

  // Dynamic multi-attribute variant resolution with smart fallback
  const resolved = resolveVariant(product, {
    size: selectedSize,
    color: selectedColor,
  });

  const currentPrice = resolved.price;
  const originalPrice = resolved.compareAtPrice;
  const currentStock = resolved.stock;
  const currentSku = resolved.sku;
  const hasCustomVariantPrice = resolved.hasCustomPrice;
  const activeImage = resolved.imageUrl || allImages[activeImageIndex] || product.cover_image_url;

  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null;
  const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;

  // Category and hierarchy helpers
  const categoryLower = (product.category || "").toLowerCase();
  const catInfo = CATEGORY_TREE[categoryLower];
  const productGender = product.gender || product.tags?.find((t) => ["Men", "Women", "Unisex"].includes(t)) || "Unisex";
  const productSubcategory = product.subcategory || (product.tags?.find((t) => t.startsWith("sub:"))?.replace("sub:", "")) || "";
  
  const isElectronics = categoryLower === "electronics";
  const isFootwear = categoryLower === "footwear" || categoryLower.includes("shoe");
  const isAccessories = categoryLower === "accessories";
  
  const variantLabel = isElectronics
    ? "Select Storage / Config"
    : isFootwear
    ? "Select Shoe Size (UK / India)"
    : isAccessories
    ? "Select Option / Size"
    : "Select Size";

  // Handle Zoom mouse movement
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Add to Bag handler
  const handleAddToCart = () => {
    const sizeToUse = selectedSize || product.sizes?.[0] || "M";
    const colorToUse = selectedColor || product.colors?.[0] || "Standard";

    dispatch(
      addToCart({
        productId: product.id,
        variantId: resolved.variant?.id || null,
        title: product.title,
        slug: product.slug,
        coverImage: activeImage || product.cover_image_url,
        price: currentPrice,
        compareAtPrice: originalPrice,
        selectedSize: sizeToUse,
        selectedColor: colorToUse,
        quantity: quantity,
        sellerName: product.seller?.store_name || "SNITCH Store",
        stock: currentStock,
        sku: currentSku,
      })
    );

    if (user) {
      dispatch(
        addToCartServer({
          productId: product.id,
          selectedSize: sizeToUse,
          selectedColor: colorToUse,
          quantity: quantity,
        })
      );
    }

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      dispatch(openCart());
    }, 450);
  };

  // Buy Now handler
  const handleBuyNow = () => {
    dispatch(
      addToCart({
        productId: product.id,
        variantId: resolved.variant?.id || null,
        title: product.title,
        slug: product.slug,
        coverImage: activeImage || product.cover_image_url,
        price: currentPrice,
        compareAtPrice: originalPrice,
        selectedSize: selectedSize || product.sizes?.[0] || "M",
        selectedColor: selectedColor || product.colors?.[0] || "Standard",
        quantity: quantity,
        sellerName: product.seller?.store_name || "SNITCH Store",
        stock: currentStock,
        sku: currentSku,
      })
    );
    dispatch(openCart());
  };

  // Check Pincode
  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.trim().length === 6 && /^\d+$/.test(pincode.trim())) {
      const deliveryDays = 2 + (parseInt(pincode.slice(-1), 10) % 3);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
      const formattedDate = deliveryDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      setPincodeStatus({
        valid: true,
        date: formattedDate,
        cod: true,
      });
    } else {
      setPincodeStatus({
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e2e1] font-sans antialiased selection:bg-[#f5c518] selection:text-[#111]">
      {/* ── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 lg:px-12 h-[72px] bg-[#111111] border-b border-[#2a2a2a]">
        <Link to="/" className="text-xl font-black tracking-tighter text-[#f5c518]">
          SNITCH
        </Link>

        {/* Center Search / Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-[#9a9078] hover:text-[#f5c518] transition-colors">
            Marketplace
          </Link>
          <Link to="/#trending-section" className="text-sm font-medium text-[#9a9078] hover:text-[#f5c518] transition-colors">
            Drops
          </Link>
          <span className="text-xs text-[#555]">/</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#f5c518] bg-[#f5c518]/10 px-2.5 py-1 rounded border border-[#f5c518]/25">
            {product.category || "Streetwear"}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Wishlist Button */}
          <button
            onClick={() => dispatch(openWishlist())}
            className="p-2 rounded text-[#f5c518] hover:bg-[#1a1a1a] transition-colors relative"
            title="Wishlist"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Bag Button */}
          <button
            onClick={() => dispatch(openCart())}
            className="p-2 rounded text-[#f5c518] hover:bg-[#1a1a1a] transition-colors relative"
            title="Shopping Bag"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f5c518] text-[#111] text-[10px] font-black flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* Seller / Account link */}
          {user?.role === "seller" ? (
            <Link
              to="/seller/dashboard"
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30 hover:bg-[#f5c518] hover:text-[#111] transition-all ml-1"
            >
              Seller Hub
            </Link>
          ) : user ? (
            <span className="text-xs font-bold text-[#9a9078] bg-[#1a1a1a] px-3 py-1.5 rounded border border-[#333]">
              {user.full_name}
            </span>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded bg-[#f5c518] text-[#111] hover:opacity-90 transition-opacity ml-1"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer onQuickView={(p) => navigate(`/product/${p.slug || p.productId}`)} />
      {sizeChartOpen && <SizeChartModal category={product.category} onClose={() => setSizeChartOpen(false)} />}

      {/* ── BREADCRUMBS ────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto pt-[92px] px-6 lg:px-12 pb-4 flex flex-wrap items-center gap-2 text-xs text-[#777]">
        <Link to="/" className="hover:text-[#f5c518] transition-colors">Home</Link>
        <span>›</span>
        {productGender && (
          <>
            <Link to="/" className="hover:text-[#f5c518] transition-colors">{productGender}</Link>
            <span>›</span>
          </>
        )}
        <Link to="/" className="hover:text-[#f5c518] transition-colors capitalize">
          {catInfo?.label || product.category || "Catalog"}
        </Link>
        {productSubcategory && (
          <>
            <span>›</span>
            <span className="text-[#aaa] capitalize">{formatSubcategoryName(product.category, productSubcategory)}</span>
          </>
        )}
        <span>›</span>
        <span className="text-[#ccc] truncate max-w-[240px] md:max-w-md font-medium">{product.title}</span>
      </div>

      {/* ── MAIN PRODUCT SECTION (2-Column Desktop Grid) ────────────────────── */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ════ LEFT COLUMN: FLIPKART STYLE GALLERY & STICKY ACTIONS (5 Cols) ════ */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-[96px]">
            <div className="flex flex-col-reverse md:flex-row gap-3.5">
              
              {/* Left Vertical Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[520px] pb-2 md:pb-0 flex-shrink-0">
                  {allImages.map((imgUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseEnter={() => setActiveImageIndex(index)}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-16 h-20 md:w-[68px] md:h-[84px] rounded-md overflow-hidden border-2 transition-all flex-shrink-0 bg-[#161616] relative ${
                        activeImageIndex === index
                          ? "border-[#f5c518] shadow-[0_0_12px_rgba(245,197,24,0.3)] opacity-100 scale-105"
                          : "border-[#2a2a2a] opacity-60 hover:opacity-100 hover:border-[#444]"
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Showcase Image */}
              <div
                className="relative flex-1 aspect-[3/4] bg-[#161616] border border-[#2a2a2a] rounded-lg overflow-hidden flex items-center justify-center cursor-crosshair group shadow-xl"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {/* Image */}
                <img
                  src={activeImage}
                  alt={product.title}
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    isZoomed ? "opacity-0 md:opacity-100" : "opacity-100"
                  }`}
                  style={
                    isZoomed
                      ? {
                          transform: "scale(1.75)",
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : {}
                  }
                />

                {/* Floating Tags */}
                {product.tags?.[0] && (
                  <span className="absolute top-3.5 left-3.5 bg-[#f5c518] text-[#111] font-black text-[10px] px-2.5 py-1 tracking-widest uppercase rounded-sm shadow-md z-10">
                    {product.tags[0]}
                  </span>
                )}

                {/* Wishlist Button Overlay */}
                <button
                  type="button"
                  onClick={() => dispatch(toggleWishlist(product))}
                  className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-[#111111]/85 hover:bg-[#111] border border-[#333] hover:border-[#f5c518] flex items-center justify-center shadow-lg backdrop-blur-sm transition-all"
                  title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill={isWishlisted ? "#f5c518" : "none"}
                    stroke={isWishlisted ? "#f5c518" : "#ffffff"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform active:scale-75"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Zoom indicator icon */}
                <div className="absolute bottom-3.5 right-3.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-[#aaa] flex items-center gap-1.5 border border-[#333] pointer-events-none group-hover:opacity-0 transition-opacity">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Hover to Zoom
                </div>
              </div>
            </div>

            {/* ── FLIPKART STYLE LARGE DUAL ACTION BUTTONS ── */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="py-4 px-4 rounded-md font-extrabold uppercase tracking-wider text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                style={{
                  backgroundColor: addedAnimation ? "#10b981" : "#f5c518",
                  color: "#111111",
                }}
              >
                {addedAnimation ? (
                  <>✓ Added to Bag</>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Add to Bag
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="py-4 px-4 rounded-md font-extrabold uppercase tracking-wider text-xs md:text-sm flex items-center justify-center gap-2 bg-[#fb641b] hover:bg-[#fa5505] text-white shadow-lg transition-all active:scale-95"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Buy Now
              </button>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: RICH PRODUCT DETAILS & HIGHLIGHTS (7 Cols) ════ */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Header / Brand & Rating */}
            <div className="border-b border-[#242424] pb-5">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#f5c518] bg-[#f5c518]/10 px-2.5 py-0.5 rounded border border-[#f5c518]/30">
                  {product.seller?.store_name || "SNITCH Official"}
                </span>
                {productGender && (
                  <span className="text-xs uppercase font-bold tracking-wider text-[#f5c518] bg-[#1f1f1f] px-2 py-0.5 rounded border border-[#333]">
                    {productGender}
                  </span>
                )}
                <span className="text-xs text-[#aaa] uppercase tracking-wider bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2a2a2a]">
                  {catInfo?.label || product.category || "Streetwear"}
                </span>
                {productSubcategory && (
                  <span className="text-xs text-[#888] uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded border border-[#262626]">
                    {formatSubcategoryName(product.category, productSubcategory)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3">
                {product.title}
              </h1>

              {/* Rating badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>4.8</span>
                  <span>★</span>
                </div>
                <span className="text-xs text-[#888] font-medium">1,420 Ratings & 384 Reviews</span>
                <span className="text-xs text-emerald-400 font-bold ml-auto flex items-center gap-1">
                  {isElectronics ? "✓ Verified Genuine Product" : "✓ Verified Original Drop"}
                </span>
              </div>
            </div>

            {/* Price & Discount Section (Flipkart style) */}
            <div className="bg-[#181818] border border-[#262626] p-4 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#888]">Special Price</p>
                {hasCustomVariantPrice && (
                  <span className="text-[10px] uppercase font-bold text-[#f5c518] bg-[#f5c518]/15 px-2 py-0.5 rounded border border-[#f5c518]/30">
                    {selectedColor ? `${selectedColor} Edition` : "Custom Variant Price"}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-black text-[#f5c518]">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-[#666] line-through">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs text-emerald-400 font-semibold">
                  You save ₹{savingsAmount.toLocaleString("en-IN")} on this order
                </p>
              )}
            </div>

            {/* ── AVAILABLE OFFERS SECTION (Flipkart style) ── */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5c518]">
                Available Offers
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-start gap-2 text-[#ccc] bg-[#161616] p-2.5 rounded border border-[#262626]">
                  <span className="text-emerald-400 font-black">🏷️</span>
                  <div>
                    <strong className="text-white">Bank Offer:</strong> 10% instant discount up to ₹500 on HDFC & ICICI Credit Cards. <span className="text-[#f5c518] underline cursor-pointer">T&C</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-[#ccc] bg-[#161616] p-2.5 rounded border border-[#262626]">
                  <span className="text-emerald-400 font-black">🏷️</span>
                  <div>
                    <strong className="text-white">Special Price:</strong> Get flat ₹150 off on Prepaid Orders via UPI / Cards.
                  </div>
                </div>
                <div className="flex items-start gap-2 text-[#ccc] bg-[#161616] p-2.5 rounded border border-[#262626]">
                  <span className="text-emerald-400 font-black">🏷️</span>
                  <div>
                    <strong className="text-white">Partner Offer:</strong> Buy this piece and get 15% discount on next streetwear drop.
                  </div>
                </div>
              </div>
            </div>

            {/* ── VARIANT / SIZE SELECTOR ── */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="border-t border-[#242424] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9a9078]">
                    {variantLabel}
                  </label>
                  {!isElectronics && !isAccessories && (
                    <button
                      type="button"
                      onClick={() => setSizeChartOpen(true)}
                      className="text-xs font-bold text-[#f5c518] hover:underline flex items-center gap-1"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      Size Chart
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[54px] h-11 px-3 text-xs font-black rounded uppercase transition-all flex items-center justify-center ${
                        selectedSize === s
                          ? "bg-[#f5c518] text-[#111] shadow-[0_0_12px_rgba(245,197,24,0.4)] scale-105"
                          : "bg-[#1c1c1c] text-[#ddd] border border-[#333] hover:border-[#666]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── COLOR SELECTOR ── */}
            {product.colors && product.colors.length > 0 && (
              <div className="border-t border-[#242424] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#9a9078]">
                    Color: <span className="text-white">{selectedColor}</span>
                  </label>
                  {hasCustomVariantPrice && (
                    <span className="text-[11px] text-[#f5c518] font-bold">
                      ₹{currentPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const cEntry = product.color_prices?.[c];
                    const cPrice = cEntry ? (typeof cEntry === "object" ? cEntry.price : cEntry) : null;
                    const hasDiffPrice = cPrice && Number(cPrice) !== Number(product.price);

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded border transition-all flex items-center gap-1.5 ${
                          selectedColor === c
                            ? "border-[#f5c518] bg-[#f5c518]/15 text-white font-bold shadow-[0_0_10px_rgba(245,197,24,0.25)]"
                            : "border-[#333] bg-[#1a1a1a] text-[#aaa] hover:border-[#555]"
                        }`}
                      >
                        <span>{c}</span>
                        {hasDiffPrice && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                              selectedColor === c
                                ? "bg-[#f5c518] text-[#111]"
                                : "bg-[#282828] text-[#f5c518]"
                            }`}
                          >
                            ₹{Number(cPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── QUANTITY & INVENTORY ── */}
            <div className="border-t border-[#242424] pt-4 flex items-center gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9a9078] block mb-2">
                  Quantity
                </label>
                <div className="flex items-center border border-[#333] rounded bg-[#1a1a1a]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-[#aaa] hover:text-white font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                    className="px-3.5 py-2 text-[#aaa] hover:text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9a9078] block mb-1">
                  Availability
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  {currentStock > 0 ? `✓ In Stock (${currentStock} units left)` : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* ── DELIVERY & PINCODE CHECKER ── */}
            <div className="border-t border-[#242424] pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9a9078] block mb-2">
                Delivery & Services
              </label>
              <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm mb-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Delivery Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="flex-1 bg-[#1a1a1a] border border-[#333] focus:border-[#f5c518] text-white text-xs px-3 py-2.5 rounded outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#f5c518] text-[#111] text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-opacity"
                >
                  Check
                </button>
              </form>

              {pincodeStatus && (
                <div className="p-3 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-xs">
                  {pincodeStatus.valid ? (
                    <div className="flex flex-col gap-1 text-emerald-400 font-medium">
                      <span>✓ Express Delivery by <strong>{pincodeStatus.date}</strong></span>
                      <span className="text-[#aaa]">✓ Free Shipping on this drop</span>
                      <span className="text-[#aaa]">✓ Cash on Delivery Available</span>
                    </div>
                  ) : (
                    <p className="text-red-400">{pincodeStatus.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* ── HIGHLIGHTS & PRODUCT SPECIFICATIONS ── */}
            <div className="border-t border-[#242424] pt-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#f5c518] mb-4">
                Product Details & Specifications
              </h3>

              {product.description && (
                <p className="text-sm text-[#ccc] leading-relaxed mb-5">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#161616] p-4 rounded-lg border border-[#242424]">
                <div className="flex justify-between border-b border-[#222] pb-2">
                  <span className="text-[#777]">Department:</span>
                  <span className="font-bold text-[#f5c518] uppercase">{productGender}</span>
                </div>
                <div className="flex justify-between border-b border-[#222] pb-2">
                  <span className="text-[#777]">Category:</span>
                  <span className="font-bold text-white uppercase">{catInfo?.label || product.category || "General"}</span>
                </div>
                {productSubcategory && (
                  <div className="flex justify-between border-b border-[#222] pb-2">
                    <span className="text-[#777]">Subcategory:</span>
                    <span className="font-bold text-white capitalize">{formatSubcategoryName(product.category, productSubcategory)}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between border-b border-[#222] pb-2">
                    <span className="text-[#777]">SKU / Identifier:</span>
                    <span className="font-mono font-bold text-white">{product.sku}</span>
                  </div>
                )}

                {isElectronics ? (
                  <>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Warranty:</span>
                      <span className="font-bold text-white">1 Year Brand Warranty</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Connectivity:</span>
                      <span className="font-bold text-white">Wireless / Bluetooth / USB-C</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Power / Battery:</span>
                      <span className="font-bold text-white">Rechargeable Li-ion</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Origin:</span>
                      <span className="font-bold text-white">Made in India / Global</span>
                    </div>
                  </>
                ) : isFootwear ? (
                  <>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Sole Material:</span>
                      <span className="font-bold text-white">High-Traction Cushioned EVA</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Upper Material:</span>
                      <span className="font-bold text-white">Breathable Mesh & Synthetic Leather</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Closure:</span>
                      <span className="font-bold text-white">Lace-Up</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Origin:</span>
                      <span className="font-bold text-white">Made in India</span>
                    </div>
                  </>
                ) : isAccessories ? (
                  <>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Material:</span>
                      <span className="font-bold text-white">Premium Grade Alloy & Fabric</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Finish:</span>
                      <span className="font-bold text-white">Matte & Anti-Tarnish</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Style:</span>
                      <span className="font-bold text-white">Urban / Streetwear Accent</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Origin:</span>
                      <span className="font-bold text-white">Made in India</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Fabric:</span>
                      <span className="font-bold text-white">100% Heavyweight Cotton</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Fit:</span>
                      <span className="font-bold text-white">Relaxed Streetwear Silhouette</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Wash Care:</span>
                      <span className="font-bold text-white">Cold Machine Wash</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222] pb-2">
                      <span className="text-[#777]">Origin:</span>
                      <span className="font-bold text-white">Made in India</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between border-b border-[#222] pb-2">
                  <span className="text-[#777]">Authentication:</span>
                  <span className="font-bold text-emerald-400">100% Verified Original</span>
                </div>
              </div>
            </div>

            {/* ── SELLER CARD ── */}
            <div className="border-t border-[#242424] pt-5">
              <div className="p-4 rounded-lg bg-[#181818] border border-[#282828] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#888] mb-0.5">Sold By</p>
                  <h4 className="text-base font-bold text-white">
                    {product.seller?.store_name || "SNITCH Creator Studio"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#f5c518] bg-[#f5c518]/15 px-2 py-0.5 rounded">
                      4.9 ★ Seller
                    </span>
                    <span className="text-xs text-[#777]">98% Positive Feedbacks</span>
                  </div>
                </div>

                <Link
                  to="/"
                  className="px-4 py-2 border border-[#444] hover:border-[#f5c518] text-xs font-bold uppercase tracking-wider rounded text-[#e0e0e0] hover:text-[#f5c518] transition-colors"
                >
                  View Store
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── REVIEWS & RATINGS SECTION ───────────────────────────────────────── */}
        <section className="mt-16 border-t border-[#242424] pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#f5c518] mb-1">Customer Feedback</p>
              <h2 className="text-2xl font-black text-white">Ratings & Reviews</h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-[#f5c518]">4.8 ★</div>
              <p className="text-xs text-[#777]">1,420 Verified Buyers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                author: "Kabir S.",
                rating: 5,
                comment: "The quality and performance are insane! Fits the modern lifestyle perfectly. Best drop I've bought this year.",
                date: "2 days ago",
                size: isElectronics ? "128GB" : isFootwear ? "UK 9" : "L",
              },
              {
                author: "Rohan M.",
                rating: 5,
                comment: "Top notch design and build. Arrived in 2 days in premium packaging. Highly recommended.",
                date: "1 week ago",
                size: isElectronics ? "256GB" : isFootwear ? "UK 10" : "XL",
              },
              {
                author: "Aditya V.",
                rating: 4,
                comment: "Very solid piece with accurate specs. Will definitely cop more from this seller.",
                date: "2 weeks ago",
                size: isElectronics ? "64GB" : isFootwear ? "UK 8" : "M",
              },
            ].map((rev, idx) => (
              <div key={idx} className="p-5 rounded-lg bg-[#161616] border border-[#242424] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{rev.author}</span>
                    <span className="text-xs text-[#666]">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#f5c518] text-xs mb-2">
                    {"★".repeat(rev.rating)}
                    <span className="text-[10px] text-emerald-400 font-bold ml-2 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      ✓ Verified Purchase
                    </span>
                  </div>
                  <p className="text-xs text-[#aaa] leading-relaxed">{rev.comment}</p>
                </div>
                <span className="text-[10px] text-[#666] uppercase tracking-wider font-semibold">
                  {isElectronics ? "Variant Selected: " : "Size Purchased: "} {rev.size}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SIMILAR / RECOMMENDED DROPS ────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-[#242424] pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#f5c518] mb-1">Curated For You</p>
                <h2 className="text-2xl font-black text-white">Similar Streetwear Drops</h2>
              </div>
              <Link to="/" className="text-xs font-bold uppercase tracking-wider text-[#f5c518] hover:underline">
                View All Drops →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedProducts.map((relProd) => (
                <div
                  key={relProd.id}
                  onClick={() => navigate(`/product/${relProd.slug || relProd.id}`)}
                  className="group flex flex-col cursor-pointer transition-all duration-300 rounded overflow-hidden bg-[#161616] border border-[#242424] hover:border-[#f5c518]"
                >
                  <div className="relative w-full aspect-square bg-[#1a1a1a] overflow-hidden">
                    {relProd.cover_image_url ? (
                      <img
                        src={relProd.cover_image_url}
                        alt={relProd.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#888] mb-1">
                        {relProd.seller?.store_name || "SNITCH"}
                      </p>
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#f5c518] transition-colors">
                        {relProd.title}
                      </h4>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#f5c518]">
                        ₹{Number(relProd.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
