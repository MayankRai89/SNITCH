import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../auth/state/auth.slice";
import { openWishlist } from "../../wishlist/state/wishlist.slice";
import { openCart } from "../../cart/state/cart.slice";
import CartDrawer from "../../cart/components/CartDrawer";
import WishlistDrawer from "../../wishlist/components/WishlistDrawer";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      dispatch(logout());
      navigate("/login");
    } catch {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e2e1] font-sans">
      {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-[72px] bg-[#111111] border-b border-[#2a2a2a]">
        <Link to="/" className="text-xl font-black tracking-tighter text-[#f5c518]">
          SNITCH
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs font-bold uppercase tracking-wider text-[#9a9078] hover:text-[#f5c518] transition-colors">
            Marketplace
          </Link>
          <button
            onClick={() => dispatch(openWishlist())}
            className="text-xs font-bold uppercase tracking-wider text-[#9a9078] hover:text-[#f5c518] transition-colors flex items-center gap-1.5"
          >
            Wishlist ({wishlistItems.length})
          </button>
          <button
            onClick={() => dispatch(openCart())}
            className="text-xs font-bold uppercase tracking-wider text-[#9a9078] hover:text-[#f5c518] transition-colors flex items-center gap-1.5"
          >
            Bag ({cartItems.reduce((s, i) => s + i.quantity, 0)})
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/60 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer onQuickView={(p) => navigate(`/product/${p.slug || p.productId}`)} />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-[1200px] mx-auto pt-[104px] px-8 pb-20">
        {/* Welcome Header */}
        <div className="p-8 rounded-xl bg-[#161616] border border-[#2a2a2a] mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#f5c518] text-[#111] font-black text-2xl flex items-center justify-center shadow-lg">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "B"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white">{user?.full_name || "Buyer"}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f5c518]/15 text-[#f5c518] border border-[#f5c518]/30">
                  Streetwear Club
                </span>
              </div>
              <p className="text-xs text-[#888]">{user?.email}</p>
            </div>
          </div>

          <Link
            to="/"
            className="px-6 py-2.5 bg-[#f5c518] text-[#111] font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
          >
            Explore New Drops →
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-[#242424] mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "orders", label: "Recent Orders" },
            { id: "wishlist", label: `Wishlist (${wishlistItems.length})` },
            { id: "settings", label: "Account Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                activeTab === tab.id
                  ? "text-[#f5c518] border-b-2 border-[#f5c518]"
                  : "text-[#888] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-lg bg-[#161616] border border-[#2a2a2a] flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#888]">Saved In Wishlist</span>
                <span className="text-3xl font-black text-[#f5c518]">{wishlistItems.length}</span>
                <button
                  onClick={() => dispatch(openWishlist())}
                  className="text-xs font-bold text-[#f5c518] hover:underline text-left mt-2"
                >
                  View Wishlist →
                </button>
              </div>

              <div className="p-6 rounded-lg bg-[#161616] border border-[#2a2a2a] flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#888]">In Shopping Bag</span>
                <span className="text-3xl font-black text-white">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
                <button
                  onClick={() => dispatch(openCart())}
                  className="text-xs font-bold text-[#f5c518] hover:underline text-left mt-2"
                >
                  Checkout Now →
                </button>
              </div>

              <div className="p-6 rounded-lg bg-[#161616] border border-[#2a2a2a] flex flex-col gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#888]">Marketplace Access</span>
                <span className="text-3xl font-black text-emerald-400">Active</span>
                <span className="text-xs text-[#777] mt-2">100% Authenticated Drops</span>
              </div>
            </div>

            {/* Wishlist preview */}
            {wishlistItems.length > 0 && (
              <div className="border border-[#2a2a2a] rounded-xl p-6 bg-[#161616]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Wishlisted Pieces</h3>
                  <button
                    onClick={() => dispatch(openWishlist())}
                    className="text-xs font-bold text-[#f5c518] hover:underline"
                  >
                    View All ({wishlistItems.length})
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {wishlistItems.slice(0, 4).map((item) => (
                    <div
                      key={item.productId}
                      onClick={() => navigate(`/product/${item.slug || item.productId}`)}
                      className="p-3 bg-[#1a1a1a] rounded border border-[#2e2e2e] hover:border-[#f5c518] cursor-pointer transition-all flex flex-col gap-2"
                    >
                      <div className="w-full aspect-square bg-[#111] rounded overflow-hidden">
                        {item.coverImage ? (
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">No image</div>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                      <span className="text-xs font-bold text-[#f5c518]">₹{Number(item.price).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="p-12 text-center border border-dashed border-[#2a2a2a] rounded-xl bg-[#161616]">
            <svg width="40" height="40" fill="none" stroke="#555" strokeWidth="1.5" className="mx-auto mb-3" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <h3 className="text-base font-bold text-white mb-1">No Orders Placed Yet</h3>
            <p className="text-xs text-[#777] max-w-sm mx-auto mb-6">
              When you order limited drops from verified sellers, your live tracking and receipts will appear here.
            </p>
            <Link
              to="/"
              className="px-6 py-2.5 bg-[#f5c518] text-[#111] font-bold text-xs uppercase tracking-widest rounded hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <div>
            {wishlistItems.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[#2a2a2a] rounded-xl bg-[#161616]">
                <h3 className="text-base font-bold text-white mb-1">Your Wishlist is Empty</h3>
                <p className="text-xs text-[#777] mb-4">Tap the heart on any drop to save items for later.</p>
                <Link to="/" className="px-6 py-2.5 bg-[#f5c518] text-[#111] font-bold text-xs uppercase tracking-widest rounded">
                  Explore Drops
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {wishlistItems.map((item) => (
                  <div
                    key={item.productId}
                    onClick={() => navigate(`/product/${item.slug || item.productId}`)}
                    className="p-4 bg-[#161616] rounded-lg border border-[#2a2a2a] hover:border-[#f5c518] cursor-pointer transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="w-full aspect-square bg-[#111] rounded overflow-hidden">
                      {item.coverImage && <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#f5c518]">{item.sellerName}</p>
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                      <span className="text-sm font-bold text-[#f5c518] mt-1 block">₹{Number(item.price).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-md p-6 rounded-xl bg-[#161616] border border-[#2a2a2a] flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-[#2a2a2a] pb-3">
              Profile Details
            </h3>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#777] uppercase font-semibold">Full Name</span>
              <span className="text-sm text-white font-medium">{user?.full_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#777] uppercase font-semibold">Email Address</span>
              <span className="text-sm text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#777] uppercase font-semibold">Account Type</span>
              <span className="text-xs font-bold uppercase text-[#f5c518]">Buyer Account</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
