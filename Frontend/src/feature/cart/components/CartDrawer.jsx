import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  closeCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  updateQuantityServer,
  removeFromCartServer,
  clearCartServer,
  fetchCartSummary,
} from "../state/cart.slice";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const { items, isOpen, couponCode, discountRate, summary } = useSelector(
    (state) => state.cart
  );

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Address state
  const [address, setAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "Delhi",
    pincode: "",
  });
  const [addressError, setAddressError] = useState("");

  // Load saved address for user
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`snitch_buyer_address_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAddress(parsed);
          setAddressForm(parsed);
        } else {
          setAddress(null);
          setAddressForm({
            fullName: user.full_name || "",
            phone: user.mobile || "",
            street: "",
            city: "",
            state: "Delhi",
            pincode: "",
          });
        }
      } catch {
        setAddress(null);
      }
    }
  }, [user]);

  // Fetch server-calculated summary whenever items or couponCode change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      dispatch(fetchCartSummary({ items, couponCode }));
    }
  }, [dispatch, isOpen, items, couponCode]);

  if (!isOpen) return null;

  // Local fallback calculations for instant responsiveness before server responds
  const totalItemsCount = summary?.itemCount ?? items.reduce((acc, item) => acc + item.quantity, 0);
  const localSubtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = summary?.subtotal ?? localSubtotal;
  const discountAmount = summary?.discountAmount ?? subtotal * (discountRate || 0);
  const shipping = summary?.shipping ?? (subtotal >= 999 || subtotal === 0 ? 0 : 99);
  const finalTotal = summary?.finalTotal ?? Math.max(0, subtotal - discountAmount + shipping);

  const freeShippingThreshold = 999;
  const freeShippingProgress = summary?.freeShippingProgress ?? Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const freeShippingDifference = summary?.freeShippingDifference ?? Math.max(0, freeShippingThreshold - subtotal);
  const productSavings = summary?.productSavings ?? 0;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    const code = inputCoupon.trim().toUpperCase();
    if (!code) return;

    dispatch(applyCoupon(code));
    const res = await dispatch(fetchCartSummary({ items, couponCode: code }));
    if (res.payload && !res.payload.isCouponValid) {
      setCouponError("Invalid coupon code. Try SNITCH10 or VIP20");
    } else {
      setInputCoupon("");
    }
  };

  const handleUpdateQty = (item, delta) => {
    dispatch(updateQuantity({ id: item.id, delta }));
    if (user && item.cartItemId) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        dispatch(removeFromCartServer(item.cartItemId));
      } else {
        dispatch(updateQuantityServer({ id: item.cartItemId, quantity: newQty }));
      }
    }
  };

  const handleRemove = (item) => {
    dispatch(removeFromCart(item.id));
    if (user && item.cartItemId) {
      dispatch(removeFromCartServer(item.cartItemId));
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    setAddressError("");

    if (!addressForm.fullName.trim()) {
      setAddressError("Please enter recipient name");
      return;
    }
    if (!addressForm.phone.trim() || !/^\d{10}$/.test(addressForm.phone.trim())) {
      setAddressError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!addressForm.street.trim()) {
      setAddressError("Please enter street address / flat details");
      return;
    }
    if (!addressForm.city.trim()) {
      setAddressError("Please enter city");
      return;
    }
    if (!addressForm.pincode.trim() || !/^\d{6}$/.test(addressForm.pincode.trim())) {
      setAddressError("Please enter a valid 6-digit PIN code");
      return;
    }

    setAddress(addressForm);
    if (user?.id) {
      localStorage.setItem(`snitch_buyer_address_${user.id}`, JSON.stringify(addressForm));
    }
    setShowAddressModal(false);
  };

  const handleCheckout = () => {
    // If user is not logged in, close drawer and redirect to login
    if (!user) {
      dispatch(closeCart());
      navigate("/login", {
        state: { notice: "Please sign in or create an account to complete your purchase." },
      });
      return;
    }

    // If user has not filled delivery address, open address form
    if (!address || !address.street || !address.pincode) {
      setShowAddressModal(true);
      return;
    }

    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderSuccess(true);
      dispatch(clearCart());
      if (user) {
        dispatch(clearCartServer());
      }
      setTimeout(() => {
        setOrderSuccess(false);
        dispatch(closeCart());
      }, 3500);
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-[250] flex justify-end"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dispatch(closeCart());
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
              fill="none"
              stroke="#f5c518"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h2 className="text-lg font-black tracking-tight uppercase text-white">
              Shopping Bag
              {totalItemsCount > 0 && (
                <span className="ml-2 text-xs font-bold text-[#f5c518] bg-[#f5c518]/15 px-2.5 py-0.5 rounded-full border border-[#f5c518]/30">
                  {totalItemsCount}
                </span>
              )}
            </h2>
          </div>

          <button
            onClick={() => dispatch(closeCart())}
            className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#303030] text-[#9a9078] hover:text-white flex items-center justify-center transition-colors border border-[#333]"
            aria-label="Close bag"
          >
            ✕
          </button>
        </div>

        {/* ── FREE SHIPPING BANNER ────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-[#181818] border-b border-[#242424]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#ccc]">
                {freeShippingDifference > 0 ? (
                  <>
                    Add{" "}
                    <span className="text-[#f5c518] font-bold">
                      ₹{freeShippingDifference.toLocaleString("en-IN")}
                    </span>{" "}
                    for Free Delivery
                  </>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ✓ You unlocked FREE Express Delivery!
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#777]">
                {freeShippingProgress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5c518] transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── ORDER SUCCESS MESSAGE ───────────────────────────────────────── */}
        {orderSuccess && (
          <div className="absolute inset-0 bg-[#141414] z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-3xl mb-4">
              ✓
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              Order Placed Successfully!
            </h3>
            <p className="text-sm text-[#9a9078] max-w-xs mb-6">
              Thank you for shopping at SNITCH. Your exclusive drops are being prepared for dispatch.
            </p>
            <div className="text-xs font-mono text-[#f5c518] bg-[#1a1a1a] px-4 py-2 rounded border border-[#333]">
              ORDER ID: #{Math.random().toString(36).substring(2, 9).toUpperCase()}
            </div>
          </div>
        )}

        {/* ── BODY / ITEMS LIST ───────────────────────────────────────────── */}
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
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white mb-1 uppercase tracking-wider">
                Your Bag is Empty
              </p>
              <p className="text-xs text-[#777] max-w-xs mb-6">
                Explore our latest drops and elevated menswear pieces to add to your collection.
              </p>
              <button
                onClick={() => dispatch(closeCart())}
                className="px-6 py-2.5 bg-[#f5c518] text-[#111] text-xs font-black uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg relative group hover:border-[#383838] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-[#111] rounded overflow-hidden flex-shrink-0 border border-[#2a2a2a]">
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
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#9a9078] bg-[#242424] px-1.5 py-0.5 rounded">
                        Size: {item.selectedSize}
                      </span>
                      {item.selectedColor && (
                        <span className="text-[11px] text-[#9a9078] bg-[#242424] px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {item.selectedColor}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Quantity */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#252525]">
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#f5c518]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-[#777]">
                          (₹{item.price.toLocaleString("en-IN")} ea)
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#333] rounded bg-[#141414]">
                      <button
                        onClick={() => handleUpdateQty(item, -1)}
                        className="w-6 h-6 flex items-center justify-center text-xs text-[#888] hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item, 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs text-[#888] hover:text-white"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item)}
                  className="absolute top-3 right-3 text-[#666] hover:text-red-400 text-xs transition-colors p-1"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER & SUMMARY ────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="p-6 bg-[#111] border-t border-[#242424] flex flex-col gap-4">
            {/* Promo Code Input */}
            <div>
              {couponCode && summary?.isCouponValid ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      ✓ {couponCode} APPLIED
                    </span>
                    <span className="text-[#888]">
                      (-{((summary?.discountRate || discountRate) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch(removeCoupon())}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. SNITCH10)"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    className="snitch-input text-xs py-2 flex-1 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-xs font-bold uppercase tracking-wider text-white rounded border border-[#3a3a3a] transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-[11px] text-red-400 mt-1">{couponError}</p>
              )}
            </div>

            {/* Delivery Address Section (for logged-in users) */}
            {user && (
              <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 overflow-hidden">
                  <span className="text-[#f5c518] text-base leading-none">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white uppercase text-[10px] tracking-wider">
                      {address ? `Deliver to: ${address.fullName}` : "Delivery Address"}
                    </p>
                    <p className="text-[#888] truncate text-[11px] mt-0.5">
                      {address
                        ? `${address.street}, ${address.city} - ${address.pincode}`
                        : "No address saved. Click to add delivery details."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#f5c518] bg-[#f5c518]/10 hover:bg-[#f5c518]/20 rounded border border-[#f5c518]/30 transition-colors flex-shrink-0"
                >
                  {address ? "Change" : "+ Add"}
                </button>
              </div>
            )}

            {/* Price Calculations */}
            <div className="flex flex-col gap-1.5 text-xs border-t border-[#222] pt-3">
              <div className="flex justify-between text-[#9a9078]">
                <span>Subtotal (Verified)</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {productSavings > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Catalogue Savings</span>
                  <span>-₹{productSavings.toLocaleString("en-IN")}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-[#9a9078]">
                <span>Shipping</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>

              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#222]">
                <span>Total Amount</span>
                <span className="text-[#f5c518]">
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-4 rounded bg-[#f5c518] hover:opacity-90 active:scale-[0.99] text-[#111] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {isCheckingOut ? (
                <>Processing Payment…</>
              ) : (
                <>
                  Checkout • ₹{finalTotal.toLocaleString("en-IN")}
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── ADDRESS MODAL OVERLAY ────────────────────────────────────────── */}
        {showAddressModal && (
          <div className="absolute inset-0 bg-[#0d0d0d]/95 backdrop-blur-md z-50 p-6 flex flex-col justify-center animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2a] mb-5">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Shipping & Delivery Details
                </h3>
                <p className="text-xs text-[#888]">
                  Enter delivery address for fast drop dispatch
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-7 h-7 rounded-full bg-[#202020] text-[#888] hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-semibold">
                {addressError}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9078] mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={addressForm.fullName}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, fullName: e.target.value })
                  }
                  className="snitch-input py-2 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9078] mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="snitch-input py-2 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9078] mb-1">
                  House / Flat / Street / Area *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Skyline Residency, MG Road"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  className="snitch-input py-2 text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9078] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    className="snitch-input py-2 text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9078] mb-1">
                    6-Digit PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        pincode: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="snitch-input py-2 text-xs w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 mt-1 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded border border-[#333] hover:bg-[#202020] text-xs font-bold uppercase tracking-wider text-[#aaa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded bg-[#f5c518] hover:opacity-90 text-xs font-black uppercase tracking-wider text-[#111] transition-opacity"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
