import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getSellerProductById, updateProduct } from "../../product/services/product.api";
import { generateVariantCombinations } from "../../product/utils/variantResolver";

import {
  DEPARTMENTS,
  CATEGORY_TREE,
  COLOR_OPTIONS,
} from "../../product/utils/categoryHierarchy";

const TAG_OPTIONS = ["NEW DROP", "BESTSELLER", "LIMITED", "EXCLUSIVE", "TRENDING", "SALE", "HOT DEAL"];

// ── Helper UI Components ───────────────────────────────────────────────────────

function FormCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg p-7 flex flex-col gap-6 ${className}`}
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="border-b pb-4" style={{ borderColor: "#242424" }}>
      <h3 className="text-base font-bold tracking-tight" style={{ color: "#e5e2e1" }}>
        {title}
      </h3>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#9a9078" }}>{sub}</p>}
    </div>
  );
}

function FieldLabel({ children, htmlFor, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-widest mb-2"
      style={{ color: "#9a9078", letterSpacing: "0.08em" }}
    >
      {children} {required && <span style={{ color: "#f5c518" }}>*</span>}
    </label>
  );
}

function PillChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
      style={{
        backgroundColor: selected ? "#f5c518" : "#222222",
        color: selected ? "#111111" : "#9a9078",
        border: selected ? "1px solid #f5c518" : "1px solid #2a2a2a",
        cursor: "pointer",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </button>
  );
}

function ColorChip({ color, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={color.label}
      className="relative flex items-center justify-center transition-all"
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: color.hex,
        border: selected ? "2px solid #f5c518" : "2px solid #2a2a2a",
        cursor: "pointer",
        boxShadow: selected ? "0 0 0 3px rgba(245,197,24,0.25)" : "none",
        outline: "none",
      }}
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color.hex === "#f0ede8" ? "#111" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function ImageUploadZone({ label, onFile, onRemove, preview, id }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  const handleDrag = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg transition-all cursor-pointer overflow-hidden group"
      style={{
        border: `2px dashed ${dragging ? "#f5c518" : "#2a2a2a"}`,
        backgroundColor: dragging ? "rgba(245,197,24,0.04)" : "#161616",
        minHeight: 200,
        boxShadow: dragging ? "0 0 0 4px rgba(245,197,24,0.08)" : "none",
      }}
      onDragOver={handleDrag}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      {preview ? (
        <div className="relative w-full h-full min-h-[200px] max-h-[280px]">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-3 right-3 bg-[#111]/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg border border-[#333]"
              title="Remove image"
            >
              ✕
            </button>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f5c518] bg-[#111]/90 px-3 py-1.5 rounded border border-[#f5c518]/30">
              Click to Replace Cover
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-8">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 56, height: 56, backgroundColor: "#222", border: "1px solid #2a2a2a" }}
          >
            <svg width="24" height="24" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#e5e2e1" }}>{label}</p>
            <p className="text-xs mt-1" style={{ color: "#9a9078" }}>
              Drag & drop or <span style={{ color: "#f5c518" }}>click to browse</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#4a4a4a" }}>PNG, JPG, WEBP — Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Edit Page ─────────────────────────────────────────────────────────────

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    sku: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    sizes: [],
    colors: [],
    tags: [],
    colorPrices: {},
    variants: [],
    isActive: true,
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const galleryInputRef = useRef(null);

  // ── Load product data on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setIsFetching(true);
      try {
        const data = await getSellerProductById(id);
        if (data && data.product) {
          const p = data.product;
          const loadedSizes = p.sizes || [];
          const loadedColors = p.colors || [];
          const loadedVariants = Array.isArray(p.variants) && p.variants.length > 0
            ? p.variants
            : generateVariantCombinations(loadedSizes, loadedColors);

          // Infer gender from tags or property
          const inferredGender = p.gender || p.tags?.find((t) => ["Men", "Women", "Unisex"].includes(t)) || "Men";
          // Infer subcategory from tags or property
          const inferredSub = p.subcategory || (p.tags?.find((t) => t.startsWith("sub:"))?.replace("sub:", "")) || "";

          setForm({
            title: p.title || "",
            description: p.description || "",
            gender: inferredGender,
            category: p.category || "clothing",
            subcategory: inferredSub,
            sku: p.sku || "",
            price: p.price !== undefined ? String(p.price) : "",
            compareAtPrice: p.compare_at_price ? String(p.compare_at_price) : "",
            stock: p.stock !== undefined ? String(p.stock) : "0",
            sizes: loadedSizes,
            colors: loadedColors,
            tags: p.tags || [],
            colorPrices: p.color_prices || {},
            variants: loadedVariants,
            isActive: p.is_active !== undefined ? p.is_active : true,
          });
          setCoverPreview(p.cover_image_url || null);
          setExistingImages(p.images || []);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load product details.");
      } finally {
        setIsFetching(false);
      }
    }
    load();
  }, [id]);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCategoryChange = (newCat) => {
    const defaultSub = CATEGORY_TREE[newCat]?.subcategories?.[0]?.id || "";
    setForm((prev) => ({
      ...prev,
      category: newCat,
      subcategory: defaultSub,
      sizes: [],
      variants: generateVariantCombinations([], prev.colors, prev.variants),
    }));
  };

  const handleGenderChange = (newGender) => {
    setForm((prev) => ({ ...prev, gender: newGender }));
  };

  const handleSubcategoryChange = (newSub) => {
    setForm((prev) => ({ ...prev, subcategory: newSub }));
  };

  const toggleArrayItem = (key, value) => {
    setForm((prev) => {
      const nextArr = prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value];
      
      const updatedForm = { ...prev, [key]: nextArr };
      if (key === "sizes" || key === "colors") {
        const nextSizes = key === "sizes" ? nextArr : prev.sizes;
        const nextColors = key === "colors" ? nextArr : prev.colors;
        updatedForm.variants = generateVariantCombinations(nextSizes, nextColors, prev.variants);
      }
      return updatedForm;
    });
  };

  const handleVariantChange = (variantId, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((v) =>
        v.id === variantId ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleGenerateMatrix = () => {
    setForm((prev) => ({
      ...prev,
      variants: generateVariantCombinations(prev.sizes, prev.colors, prev.variants),
    }));
  };

  const handleColorPriceChange = (colorLabel, field, value) => {
    setForm((prev) => {
      const current = prev.colorPrices?.[colorLabel] || {};
      const updatedEntry = typeof current === "object" ? { ...current, [field]: value } : { price: value };
      return {
        ...prev,
        colorPrices: {
          ...prev.colorPrices,
          [colorLabel]: updatedEntry,
        },
      };
    });
  };

  const handleCoverFile = (file) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = (e) => {
    if (e) e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleGalleryFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const totalAllowed = 8 - existingImages.length;
    const combined = [...galleryFiles, ...selected].slice(0, Math.max(0, totalAllowed));
    setGalleryFiles(combined);
    setGalleryPreviews(combined.map((f) => URL.createObjectURL(f)));

    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleRemoveNewGalleryFile = (index, e) => {
    if (e) e.stopPropagation();
    const updatedFiles = galleryFiles.filter((_, idx) => idx !== index);
    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveExistingImage = (index, e) => {
    if (e) e.stopPropagation();
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Product title is required.");
    if (!form.category) return setError("Please select a category.");
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      return setError("Enter a valid price.");
    if (form.compareAtPrice && (isNaN(form.compareAtPrice) || Number(form.compareAtPrice) < Number(form.price)))
      return setError("Compare at price (MRP / Original Price) must be greater than or equal to the selling price.");
    if (!coverFile && !coverPreview) return setError("A cover image is required.");

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category.toLowerCase());
      fd.append("gender", form.gender || "Unisex");
      fd.append("subcategory", form.subcategory || "");
      fd.append("sku", form.sku.trim());
      fd.append("price", form.price);
      if (form.compareAtPrice) fd.append("compare_at_price", form.compareAtPrice);
      else fd.append("compare_at_price", "");
      fd.append("stock", form.stock || "0");
      fd.append("is_active", String(form.isActive));

      const combinedTags = [...(form.tags || [])];
      if (form.gender && !combinedTags.includes(form.gender)) combinedTags.push(form.gender);
      if (form.subcategory && !combinedTags.includes(form.subcategory)) combinedTags.push(form.subcategory);

      fd.append("sizes", JSON.stringify(form.sizes));
      fd.append("colors", JSON.stringify(form.colors));
      fd.append("tags", JSON.stringify(combinedTags));

      // Clean colorPrices to only include non-empty entries
      const cleanColorPrices = {};
      if (form.colorPrices) {
        Object.entries(form.colorPrices).forEach(([c, val]) => {
          if (!form.colors.includes(c)) return;
          if (typeof val === "object") {
            const p = parseFloat(val.price);
            const cap = val.compare_at_price ? parseFloat(val.compare_at_price) : null;
            if (!isNaN(p) && p >= 0) {
              cleanColorPrices[c] = { price: p, ...(cap && cap >= p ? { compare_at_price: cap } : {}) };
            }
          } else if (typeof val === "number" || typeof val === "string") {
            const p = parseFloat(val);
            if (!isNaN(p) && p >= 0) {
              cleanColorPrices[c] = { price: p };
            }
          }
        });
      }
      fd.append("color_prices", JSON.stringify(cleanColorPrices));

      // Clean variants matrix (empty fields omitted for automatic fallback)
      const cleanVariants = (form.variants || []).map((v) => {
        const cleaned = {
          id: v.id,
          attributes: v.attributes,
        };
        if (v.price !== "" && v.price !== undefined && !isNaN(v.price) && Number(v.price) >= 0) {
          cleaned.price = parseFloat(v.price);
        }
        if (v.compare_at_price !== "" && v.compare_at_price !== undefined && !isNaN(v.compare_at_price) && Number(v.compare_at_price) >= 0) {
          cleaned.compare_at_price = parseFloat(v.compare_at_price);
        }
        if (v.stock !== "" && v.stock !== undefined && !isNaN(v.stock) && Number(v.stock) >= 0) {
          cleaned.stock = parseInt(v.stock, 10);
        }
        if (v.sku && String(v.sku).trim()) {
          cleaned.sku = String(v.sku).trim();
        }
        return cleaned;
      });
      fd.append("variants", JSON.stringify(cleanVariants));

      if (coverFile) fd.append("coverImage", coverFile);
      galleryFiles.forEach((f) => fd.append("galleryImages", f));

      await updateProduct(id, fd);
      setSuccess("Product updated successfully!");
      setTimeout(() => navigate("/seller/dashboard"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#111111" }}>
        <p className="text-sm font-bold text-[#f5c518] animate-pulse">Loading product details…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif" }}>

      {/* Navbar */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-[68px]"
        style={{ backgroundColor: "#111111", borderBottom: "1px solid #2a2a2a" }}
      >
        <Link
          to="/"
          className="text-xl font-black tracking-tighter"
          style={{ color: "#f5c518", textDecoration: "none", letterSpacing: "-0.03em" }}
        >
          SNITCH
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/seller/dashboard"
            className="text-xs font-semibold uppercase tracking-widest transition-colors"
            style={{ color: "#9a9078", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e2e1")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[68px] max-w-[1200px] mx-auto px-8 py-12">
        <header className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c518", letterSpacing: "0.18em" }}>
            Seller Hub • Edit Listing
          </p>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", letterSpacing: "-0.03em", color: "#ffffff" }}>
            Edit Product
          </h1>
        </header>

        {/* Status Banners */}
        {error && (
          <div role="alert" className="rounded p-4 mb-8 text-sm font-medium bg-red-950/40 border border-red-800/60 text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="rounded p-4 mb-8 text-sm font-medium bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start" noValidate>

          {/* Left Form Area */}
          <div className="flex-1 flex flex-col gap-8 w-full">

            {/* Card 1: Core Details */}
            <FormCard>
              <SectionHeader title="Product Classification & Details" sub="Department, Category, and Specs" />

              <div className="flex flex-col gap-6">
                {/* 1. Target Department */}
                <div>
                  <FieldLabel required>1. Target Department / Audience</FieldLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {DEPARTMENTS.map((dept) => {
                      const isSel = form.gender === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleGenderChange(dept.id)}
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                          style={{
                            backgroundColor: isSel ? "rgba(245,197,24,0.15)" : "#161616",
                            border: isSel ? "1.5px solid #f5c518" : "1px solid #2a2a2a",
                            color: isSel ? "#f5c518" : "#9a9078",
                            cursor: "pointer",
                          }}
                        >
                          <span className="text-base">{dept.icon}</span>
                          <span>{dept.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Main Category Selector */}
                <div>
                  <FieldLabel required>2. Main Category</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {Object.entries(CATEGORY_TREE).map(([catKey, catObj]) => {
                      const isSel = form.category === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => handleCategoryChange(catKey)}
                          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-center transition-all"
                          style={{
                            backgroundColor: isSel ? "rgba(245,197,24,0.12)" : "#161616",
                            border: isSel ? "1.5px solid #f5c518" : "1px solid #2a2a2a",
                            color: isSel ? "#ffffff" : "#888888",
                            cursor: "pointer",
                          }}
                        >
                          <span className="text-xl">{catObj.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider line-clamp-1">{catObj.label.split("&")[0]}</span>
                          <span className="text-[10px] text-[#f5c518]/70 font-mono tracking-widest">{catObj.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Subcategory Selector */}
                {CATEGORY_TREE[form.category]?.subcategories && (
                  <div>
                    <FieldLabel htmlFor="product-subcategory" required>
                      3. Subcategory (e.g. Sneakers, Loafers, Cargo Denim)
                    </FieldLabel>
                    <select
                      id="product-subcategory"
                      value={form.subcategory}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      className="snitch-input"
                      style={{ appearance: "none", cursor: "pointer" }}
                    >
                      <option value="">Select specific subcategory…</option>
                      {CATEGORY_TREE[form.category].subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id} style={{ backgroundColor: "#1a1a1a" }}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div>
                  <FieldLabel htmlFor="product-title" required>Title</FieldLabel>
                  <input
                    id="product-title"
                    type="text"
                    placeholder="e.g. Acid Wash Boxy Hoodie"
                    value={form.title}
                    onChange={setField("title")}
                    className="snitch-input"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <FieldLabel htmlFor="product-description">Description</FieldLabel>
                  <textarea
                    id="product-description"
                    rows={4}
                    placeholder="Fit, material, care instructions, inspiration…"
                    value={form.description}
                    onChange={setField("description")}
                    className="snitch-input resize-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <FieldLabel htmlFor="product-sku">SKU / Model Identifier</FieldLabel>
                  <input
                    id="product-sku"
                    type="text"
                    placeholder="e.g. HOOD-BLK-001"
                    value={form.sku}
                    onChange={setField("sku")}
                    className="snitch-input"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="product-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-[#f5c518] cursor-pointer"
                  />
                  <label htmlFor="product-active" className="text-xs font-semibold uppercase tracking-wider text-[#e5e2e1] cursor-pointer">
                    Product is Live and visible to buyers
                  </label>
                </div>
              </div>
            </FormCard>

            {/* Card 2: Pricing & Stock */}
            <FormCard>
              <SectionHeader title="Pricing & Inventory" sub="Set your selling price and available units" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selling Price */}
                <div>
                  <FieldLabel htmlFor="product-price" required>Price (₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none text-[#f5c518]">₹</span>
                    <input
                      id="product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={setField("price")}
                      className="snitch-input"
                      style={{ paddingLeft: "2rem" }}
                      required
                    />
                  </div>
                </div>

                {/* Compare at price */}
                <div>
                  <FieldLabel htmlFor="product-compare">Compare at (MRP ₹)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none text-[#9a9078]">₹</span>
                    <input
                      id="product-compare"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.compareAtPrice}
                      onChange={setField("compareAtPrice")}
                      className="snitch-input"
                      style={{ paddingLeft: "2rem" }}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <FieldLabel htmlFor="product-stock">Stock Qty</FieldLabel>
                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.stock}
                    onChange={setField("stock")}
                    className="snitch-input"
                  />
                </div>
              </div>

              {form.compareAtPrice && form.price && Number(form.compareAtPrice) > Number(form.price) && (
                <p className="mt-2 text-xs text-[#9a9078]">
                  <span className="text-[#f5c518] font-bold">
                    {Math.round(((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100)}% off
                  </span>{" "}— discount badge will display on storefront.
                </p>
              )}

              {form.compareAtPrice && form.price && Number(form.compareAtPrice) < Number(form.price) && (
                <p className="mt-2 text-xs text-red-400">
                  Compare at price (MRP) must be greater than or equal to selling price.
                </p>
              )}
            </FormCard>

            {/* Card 3: Variants */}
            <FormCard>
              <SectionHeader
                title="Variants & Attributes"
                sub={
                  CATEGORY_TREE[form.category?.toLowerCase()]
                    ? `${CATEGORY_TREE[form.category.toLowerCase()].sizeLabel} (${CATEGORY_TREE[form.category.toLowerCase()].label})`
                    : "Select available sizes, storage, or configurations"
                }
              />

              <div className="flex flex-col gap-7">
                {/* Dynamic Variants (Sizes / Storage / Specs) */}
                <div>
                  <FieldLabel>
                    {CATEGORY_TREE[form.category?.toLowerCase()]
                      ? CATEGORY_TREE[form.category.toLowerCase()].sizeLabel
                      : "Available Sizes / Variants"}
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(
                      CATEGORY_TREE[form.category?.toLowerCase()]?.sizeOptions || [
                        "XS", "S", "M", "L", "XL", "XXL"
                      ]
                    ).map((s) => (
                      <PillChip
                        key={s}
                        label={s}
                        selected={form.sizes.includes(s)}
                        onToggle={() => toggleArrayItem("sizes", s)}
                      />
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <FieldLabel>Colors</FieldLabel>
                  <div className="flex flex-wrap gap-3 mt-1 items-center">
                    {COLOR_OPTIONS.map((c) => (
                      <ColorChip
                        key={c.label}
                        color={c}
                        selected={form.colors.includes(c.label)}
                        onToggle={() => toggleArrayItem("colors", c.label)}
                      />
                    ))}
                  </div>

                  {/* Color-Specific Pricing Options */}
                  {form.colors.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[#262626]">
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">
                            🏷️ Color / Edition Pricing (Optional)
                          </span>
                          <span className="text-[10px] bg-[#f5c518]/15 text-[#f5c518] px-2 py-0.5 rounded border border-[#f5c518]/30 font-bold">
                            Amazon & Flipkart Style
                          </span>
                        </div>
                        <p className="text-[11px] text-[#888] mt-1">
                          Set custom prices for special colors or limited editions. Colors left blank will automatically sell at the Base Price (₹{form.price || "0"}).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {form.colors.map((c) => {
                          const colorData = COLOR_OPTIONS.find((opt) => opt.label === c) || { hex: "#888" };
                          const entry = form.colorPrices?.[c];
                          const priceVal = typeof entry === "object" ? (entry.price ?? "") : (entry ?? "");
                          const compareVal = typeof entry === "object" ? (entry.compare_at_price ?? "") : "";

                          return (
                            <div key={c} className="p-3 rounded-lg bg-[#141414] border border-[#2a2a2a] flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-[#444]"
                                    style={{ backgroundColor: colorData.hex }}
                                  />
                                  <span className="text-xs font-bold text-white">{c}</span>
                                </div>
                                {priceVal && (
                                  <span className="text-[10px] font-bold text-emerald-400">
                                    Custom Price Active
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div>
                                  <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">
                                    Selling Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={`Base (₹${form.price || "0"})`}
                                    value={priceVal}
                                    onChange={(e) => handleColorPriceChange(c, "price", e.target.value)}
                                    className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-[#888] uppercase tracking-wider block mb-1">
                                    MRP / Compare (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={`MRP (₹${form.compareAtPrice || "0"})`}
                                    value={compareVal}
                                    onChange={(e) => handleColorPriceChange(c, "compare_at_price", e.target.value)}
                                    className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <FieldLabel>Product Tags</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TAG_OPTIONS.map((t) => (
                      <PillChip
                        key={t}
                        label={t}
                        selected={form.tags.includes(t)}
                        onToggle={() => toggleArrayItem("tags", t)}
                      />
                    ))}
                  </div>
                </div>

                {/* Multi-Attribute Variant Matrix Section */}
                {form.sizes.length > 0 && form.colors.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#262626]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">
                            ⚡ Multi-Attribute Variant Matrix ({form.variants?.length || 0} Combinations)
                          </span>
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
                            Inherited Defaults Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#888] mt-1">
                          Combine <strong>Sizes & Colors</strong>. Any field you leave blank automatically uses the product's default (Price: ₹{form.price || "0"}, Stock: {form.stock || "0"}).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateMatrix}
                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#222] hover:bg-[#333] text-[#ccc] hover:text-white border border-[#333] transition-all flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>🔄 Re-sync Matrix</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#141414] max-h-[380px] overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 bg-[#1f1f1f] text-[#f5c518] uppercase tracking-wider border-b border-[#2a2a2a] z-10">
                          <tr>
                            <th className="p-3 font-bold">Variant Combination</th>
                            <th className="p-3 font-bold">Custom Price (₹)</th>
                            <th className="p-3 font-bold">Custom MRP (₹)</th>
                            <th className="p-3 font-bold">Stock Qty</th>
                            <th className="p-3 font-bold">Variant SKU</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#242424] text-[#ccc]">
                          {form.variants?.map((v) => (
                            <tr key={v.id} className="hover:bg-[#191919] transition-colors">
                              <td className="p-3 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#222] px-2 py-0.5 rounded border border-[#333] text-[11px] text-[#f5c518]">
                                    {v.attributes?.size}
                                  </span>
                                  <span className="text-[#666]">•</span>
                                  <span className="bg-[#222] px-2 py-0.5 rounded border border-[#333] text-[11px] text-white">
                                    {v.attributes?.color}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={`₹${form.price || "0"} (Default)`}
                                  value={v.price ?? ""}
                                  onChange={(e) => handleVariantChange(v.id, "price", e.target.value)}
                                  className="w-full min-w-[110px] bg-[#1a1a1a] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={`₹${form.compareAtPrice || "0"} (Default)`}
                                  value={v.compare_at_price ?? ""}
                                  onChange={(e) => handleVariantChange(v.id, "compare_at_price", e.target.value)}
                                  className="w-full min-w-[110px] bg-[#1a1a1a] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder={`${form.stock || "0"} (Default)`}
                                  value={v.stock ?? ""}
                                  onChange={(e) => handleVariantChange(v.id, "stock", e.target.value)}
                                  className="w-full min-w-[90px] bg-[#1a1a1a] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder={form.sku ? `${form.sku}-${v.attributes?.size}-${v.attributes?.color}` : "SKU"}
                                  value={v.sku ?? ""}
                                  onChange={(e) => handleVariantChange(v.id, "sku", e.target.value)}
                                  className="w-full min-w-[130px] bg-[#1a1a1a] border border-[#333] focus:border-[#f5c518] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </FormCard>

            {/* Card 4: Images */}
            <FormCard>
              <SectionHeader title="Product Images" sub="Upload high-res photos to showcase the garment" />

              {/* Cover Image */}
              <div className="mb-5">
                <FieldLabel htmlFor="cover-upload" required>Cover Image (Primary thumbnail)</FieldLabel>
                <ImageUploadZone
                  id="cover-upload"
                  label="Drop new cover image here"
                  onFile={handleCoverFile}
                  onRemove={handleRemoveCover}
                  preview={coverPreview}
                />
              </div>

              {/* Gallery Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Gallery Images ({existingImages.length + galleryFiles.length}/8)</FieldLabel>
                </div>

                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  {/* Existing gallery images from DB */}
                  {existingImages.map((src, i) => (
                    <div key={`existing-${i}`} className="relative rounded group overflow-hidden border border-[#333] bg-[#161616]" style={{ aspectRatio: "1" }}>
                      <img src={src} alt={`Saved ${i + 1}`} className="w-full h-full object-cover rounded" />
                      <span className="absolute top-1.5 left-1.5 bg-black/70 text-[#f5c518] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveExistingImage(i, e)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Newly selected gallery previews */}
                  {galleryPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative rounded group overflow-hidden border border-[#f5c518]/60 bg-[#161616]" style={{ aspectRatio: "1" }}>
                      <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover rounded" />
                      <span className="absolute top-1.5 left-1.5 bg-[#f5c518] text-[#111] text-[10px] font-black px-1.5 py-0.5 rounded">
                        NEW
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveNewGalleryFile(i, e)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add more button slot */}
                  {existingImages.length + galleryFiles.length < 8 && (
                    <div
                      className="relative rounded flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed border-[#2a2a2a] hover:border-[#f5c518] bg-[#161616] hover:bg-[#1a1a1a]"
                      style={{ aspectRatio: "1" }}
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center mb-1 text-[#f5c518]">
                        +
                      </div>
                      <span className="text-[11px] font-medium text-[#9a9078]">
                        Add Photos
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryFiles}
                />
                <p className="mt-2.5 text-xs text-[#777]">
                  Click &ldquo;+ Add Photos&rdquo; to add more images to your product gallery.
                </p>
              </div>
            </FormCard>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 py-4">
              <button
                type="button"
                onClick={() => navigate("/seller/dashboard")}
                className="px-6 py-3.5 rounded text-xs font-bold uppercase tracking-widest text-[#9a9078] hover:text-white bg-transparent border border-[#333] hover:border-[#555] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-10 py-3.5 rounded text-xs font-black uppercase tracking-widest bg-[#f5c518] text-[#111] hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60"
              >
                {isLoading ? "Saving Changes…" : "Save & Update Product"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
