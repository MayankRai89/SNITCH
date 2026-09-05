import { useDispatch, useSelector } from "react-redux";
import {
  closeWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../state/wishlist.slice";
import { addToCart, addToCartServer } from "../../cart/state/cart.slice";

export default function WishlistDrawer({ onQuickView }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { items, isOpen } = useSelector((state) => state.wishlist);

  if (!isOpen) return null;

  const handleMoveToBag = (item) => {
    const selectedSize = item.sizes?.[0] || "M";
    const selectedColor = item.colors?.[0] || "Standard";

    dispatch(
      addToCart({
        productId: item.productId,
        title: item.title,
        slug: item.slug,
        coverImage: item.coverImage,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        selectedSize,
        selectedColor,
        quantity: 1,
        sellerName: item.sellerName,
        stock: item.stock,
      })
    );

    if (user) {
      dispatch(
        addToCartServer({
          productId: item.productId,
          selectedSize,
          selectedColor,
          quantity: 1,
        })
      );
    }

    dispatch(removeFromWishlist(item.productId));
  };

  return (
    <div
      role="dialog"
      aria-label="Wishlist"
      className="fixed inset-0 z-[250] flex justify-end"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dispatch(closeWishlist());
      }}
    >
      <div
        className="w-full max-w-[460px] h-full bg-[#141414] border-l border-[#2a2a2a] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative"
        style={{ color: "#e5e2e1" }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-[#242424] flex items-center justify-between bg-[#111]">
          <div className="flex items-center gap-3">
            <svg
              width="22"
              height="22"
              fill="currentColor"
              className="text-[#f5c518]"
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h2 className="text-lg font-black tracking-tight uppercase text-white">
              My Wishlist
              {items.length > 0 && (
                <span className="ml-2 text-xs font-bold text-[#f5c518] bg-[#f5c518]/15 px-2.5 py-0.5 rounded-full border border-[#f5c518]/30">
                  {items.length}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearWishlist())}
                className="text-xs text-[#777] hover:text-red-400 transition-colors mr-2"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => dispatch(closeWishlist())}
              className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#303030] text-[#9a9078] hover:text-white flex items-center justify-center transition-colors border border-[#333]"
              aria-label="Close wishlist"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── ITEMS LIST ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4 text-[#444]">
                <svg
                  width="36"
                  height="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Your Wishlist is Empty
              </h3>
              <p className="text-xs text-[#777] max-w-[240px] mb-6">
                Tap the heart icon on any product to save pieces you love for later.
              </p>
              <button
                onClick={() => dispatch(closeWishlist())}
                className="px-6 py-2.5 bg-[#f5c518] text-[#111] text-xs font-bold uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
              >
                Explore Drops
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 p-3.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg relative group hover:border-[#383838] transition-colors"
              >
                {/* Thumbnail */}
                <div
                  className="w-20 h-24 bg-[#111] rounded overflow-hidden flex-shrink-0 border border-[#2a2a2a] cursor-pointer"
                  onClick={() => {
                    dispatch(closeWishlist());
                    if (onQuickView) onQuickView(item);
                  }}
                >
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="pr-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#f5c518] truncate mb-0.5">
                      {item.sellerName}
                    </p>
                    <h4
                      className="text-sm font-semibold text-white truncate cursor-pointer hover:text-[#f5c518] transition-colors"
                      onClick={() => {
                        dispatch(closeWishlist());
                        if (onQuickView) onQuickView(item);
                      }}
                    >
                      {item.title}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-sm font-bold text-[#f5c518]">
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-[11px] text-[#666] line-through">
                          ₹{item.compareAtPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Move to Bag */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#252525]">
                    <button
                      onClick={() => handleMoveToBag(item)}
                      className="flex-1 py-2 rounded bg-[#f5c518] hover:opacity-90 text-[#111] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                      </svg>
                      Move to Bag
                    </button>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => dispatch(removeFromWishlist(item.productId))}
                  className="absolute top-3 right-3 text-[#666] hover:text-red-400 text-xs transition-colors p-1"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
