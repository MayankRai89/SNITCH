import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useCreateProduct } from "../../product/hook/useproduct";
import { generateVariantCombinations } from "../../product/utils/variantResolver";
import {
  DEPARTMENTS,
  CATEGORY_TREE,
  COLOR_OPTIONS,
} from "../../product/utils/categoryHierarchy";

const CATEGORIES = Object.keys(CATEGORY_TREE);
const TAG_OPTIONS = ["NEW DROP", "TRENDING", "BESTSELLER", "LIMITED", "EXCLUSIVE", "HOT DEAL"];

// ── Helper: Section Header ─────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: "#f5c518" }} />
      <h2 className="text-base font-semibold uppercase tracking-widest" style={{ color: "#e5e2e1", letterSpacing: "0.1em" }}>
        {title}
      </h2>
    </div>
  );
}

// ── Helper: Form Card ──────────────────────────────────────────────────────────

function FormCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg p-7 ${className}`}
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      {children}
    </div>
  );
}

// ── Helper: Label ──────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-widest mb-2"
      style={{ color: "#9a9078" }}
    >
      {children}
    </label>
  );
}

// ── Helper: Pill Chip Toggle ───────────────────────────────────────────────────

function PillChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all"
      style={{
        border: selected ? "1px solid #f5c518" : "1px solid #2a2a2a",
        backgroundColor: selected ? "rgba(245,197,24,0.12)" : "transparent",
        color: selected ? "#f5c518" : "#9a9078",
        cursor: "pointer",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </button>
  );
}

// ── Helper: Color Chip ─────────────────────────────────────────────────────────

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

// ── Image Upload Zone ──────────────────────────────────────────────────────────

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

// ── Preview Card ───────────────────────────────────────────────────────────────

function ProductPreviewCard({ form, coverPreview }) {
  const hasTitle = form.title.trim();
  const hasPrice = form.price.trim();
  const catObj = CATEGORY_TREE[form.category?.toLowerCase()];

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #2a2a2a", backgroundColor: "#161616" }}>
      {/* Image area */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: 220, backgroundColor: "#1a1a1a" }}
      >
        {coverPreview ? (
          <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <svg width="40" height="40" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p className="text-xs uppercase tracking-widest" style={{ color: "#9a9078" }}>Cover Photo</p>
          </div>
        )}

        {/* Tag badge */}
        {form.tags.length > 0 && (
          <span
            className="absolute top-3 left-3 text-xs font-bold px-2 py-1 uppercase tracking-widest"
            style={{ backgroundColor: "#f5c518", color: "#111" }}
          >
            {form.tags[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4" style={{ borderTop: "1px solid #2a2a2a" }}>
        {/* Department / Category / Subcategory hierarchy pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {form.gender && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(245,197,24,0.12)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.3)" }}
            >
              {form.gender}
            </span>
          )}
          {form.category && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: "#262626", color: "#e5e2e1" }}
            >
              {catObj?.label || form.category}
            </span>
          )}
          {form.subcategory && (
            <span
              className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: "#1c1c1c", color: "#9a9078", border: "1px solid #2a2a2a" }}
            >
              {catObj?.subcategories?.find((s) => s.id === form.subcategory)?.label || form.subcategory}
            </span>
          )}
        </div>

        <p className="text-base font-semibold leading-snug mb-1" style={{ color: hasTitle ? "#e5e2e1" : "#4a4a4a" }}>
          {hasTitle ? form.title : "Product Title"}
        </p>
        <p className="text-lg font-bold" style={{ color: "#f5c518" }}>
          {hasPrice ? `₹${Number(form.price).toLocaleString("en-IN")}` : "₹ –"}
        </p>

        {/* Sizes */}
        {form.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.sizes.map((s) => (
              <span
                key={s}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ border: "1px solid #2a2a2a", color: "#9a9078" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  const [form, setForm] = useState({
    title: "",
    description: "",
    gender: "Men",
    category: "footwear",
    subcategory: "sneakers",
    sku: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    sizes: [],
    colors: [],
    tags: [],
    colorPrices: {},
    variants: [],
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const galleryInputRef = useRef(null);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleArrayItem = (key, value) => {
    setForm((prev) => {
      const nextArr = prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value];
      
      const updatedForm = { ...prev, [key]: nextArr };
      // If sizes or colors change, keep variant matrix in sync
      if (key === "sizes" || key === "colors") {
        const nextSizes = key === "sizes" ? nextArr : prev.sizes;
        const nextColors = key === "colors" ? nextArr : prev.colors;
        updatedForm.variants = generateVariantCombinations(nextSizes, nextColors, prev.variants);
      }
      return updatedForm;
    });
  };

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

    // Append new files up to 8 total
    const combined = [...galleryFiles, ...selected].slice(0, 8);
    setGalleryFiles(combined);
    setGalleryPreviews(combined.map((f) => URL.createObjectURL(f)));

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleRemoveGalleryFile = (index, e) => {
    if (e) e.stopPropagation();
    const updatedFiles = galleryFiles.filter((_, idx) => idx !== index);
    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("category", form.category.toLowerCase());
    fd.append("gender", form.gender || "Unisex");
    fd.append("subcategory", form.subcategory || "");
    fd.append("sku", form.sku.trim());
    fd.append("price", form.price);
    if (form.compareAtPrice) fd.append("compare_at_price", form.compareAtPrice);
    fd.append("stock", form.stock || "0");

    // Automatically append gender and subcategory into searchable tags
    const combinedTags = [...(form.tags || [])];
    if (form.gender && !combinedTags.includes(form.gender)) {
      combinedTags.push(form.gender);
    }
    if (form.subcategory && !combinedTags.includes(form.subcategory)) {
      combinedTags.push(form.subcategory);
    }
    const catLabel = CATEGORY_TREE[form.category]?.label;
    if (catLabel && !combinedTags.includes(catLabel)) {
      combinedTags.push(catLabel);
    }

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

    // Clean multi-attribute variants matrix (empty fields omitted for automatic fallback)
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

    // Must match Multer field names in product.routes.js
    if (coverFile) fd.append("coverImage", coverFile);
    galleryFiles.forEach((f) => fd.append("galleryImages", f));
    return fd;
  };

  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Product title is required.");
    if (!form.category) return setError("Please select a category.");
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      return setError("Enter a valid price.");
    if (form.compareAtPrice && (isNaN(form.compareAtPrice) || Number(form.compareAtPrice) < Number(form.price)))
      return setError("Compare at price (MRP / Original Price) must be greater than or equal to the selling price.");
    if (!coverFile) return setError("A cover image is required.");

    setIsLoading(true);
    try {
      const fd = buildFormData();
      if (asDraft) fd.append("is_active", "false");
      await createProduct(fd);
      setSuccess(asDraft ? "Saved as draft!" : "Product published successfully!");
      setTimeout(() => navigate("/seller/dashboard"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#111111", color: "#e5e2e1", fontFamily: "'Geist', sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
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
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "#9a9078", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9a9078")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Page Content ────────────────────────────────────────────────────── */}
      <main className="pt-[68px]">
        <div className="max-w-[1320px] mx-auto px-8 py-12">

          {/* Page header */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f5c518", letterSpacing: "0.18em" }}>
              Seller Studio
            </p>
            <h1 className="font-black leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", color: "#ffffff" }}>
              Create New Product
            </h1>
            <p className="mt-3 text-base" style={{ color: "#9a9078" }}>
              List your latest drop on the SNITCH marketplace.
            </p>
          </div>

          {/* ── Global status banners ────────────────────────────────────────── */}
          {error && (
            <div
              className="mb-6 rounded-lg px-5 py-4 text-sm font-medium flex items-center gap-3"
              style={{ backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-6 rounded-lg px-5 py-4 text-sm font-medium flex items-center gap-3"
              style={{ backgroundColor: "rgba(245,197,24,0.08)", border: "1px solid rgba(245,197,24,0.3)", color: "#f5c518" }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          {/* ── Two-column layout ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex gap-8 items-start">

              {/* ── LEFT: Form ─────────────────────────────────────────────── */}
              <div className="flex flex-col gap-6 min-w-0 flex-1">

                {/* Card 1: Product Classification & Details */}
                <FormCard>
                  <SectionHeader title="Product Classification & Details" />

                  <div className="flex flex-col gap-6">
                    {/* 1. Target Department / Audience */}
                    <div>
                      <FieldLabel>1. Target Department / Audience *</FieldLabel>
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
                      <FieldLabel>2. Main Category *</FieldLabel>
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
                        <FieldLabel htmlFor="product-subcategory">
                          3. Subcategory (e.g. Sneakers, Loafers, Cargo Denim) *
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
                      <FieldLabel htmlFor="product-title">Product Title *</FieldLabel>
                      <input
                        id="product-title"
                        type="text"
                        placeholder="e.g. Obsidian Street Retro Sneaker / Acid Oversized Hoodie"
                        value={form.title}
                        onChange={setField("title")}
                        className="snitch-input"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <FieldLabel htmlFor="product-desc">Description</FieldLabel>
                      <textarea
                        id="product-desc"
                        rows={4}
                        placeholder="Describe the silhouette, materials, sole technology, fit inspiration…"
                        value={form.description}
                        onChange={setField("description")}
                        className="snitch-input resize-none"
                        style={{ lineHeight: "1.6" }}
                      />
                    </div>

                    {/* SKU */}
                    <div>
                      <FieldLabel htmlFor="product-sku">SKU / Model Identifier</FieldLabel>
                      <input
                        id="product-sku"
                        type="text"
                        placeholder="e.g. SNT-KICKS-OBS-42"
                        value={form.sku}
                        onChange={setField("sku")}
                        className="snitch-input"
                      />
                    </div>
                  </div>
                </FormCard>

                {/* Card 2: Pricing & Inventory */}
                <FormCard>
                  <SectionHeader title="Pricing & Inventory" />

                  <div className="grid grid-cols-3 gap-4">
                    {/* Price */}
                    <div>
                      <FieldLabel htmlFor="product-price">Selling Price (₹) *</FieldLabel>
                      <div className="relative">
                        <span
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
                          style={{ color: "#9a9078" }}
                        >
                          ₹
                        </span>
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
                      <FieldLabel htmlFor="product-compare">Compare at Price / MRP (₹)</FieldLabel>
                      <div className="relative">
                        <span
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
                          style={{ color: "#9a9078" }}
                        >
                          ₹
                        </span>
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
                    <p className="mt-3 text-xs" style={{ color: "#9a9078" }}>
                      <span style={{ color: "#f5c518" }}>
                        {Math.round(((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100)}% off
                      </span>
                      {" "}— discount badge will show on the product card.
                    </p>
                  )}

                  {form.compareAtPrice && form.price && Number(form.compareAtPrice) < Number(form.price) && (
                    <p className="mt-3 text-xs text-red-400">
                      Compare at price (MRP) must be greater than or equal to selling price.
                    </p>
                  )}
                </FormCard>

                {/* Card 3: Variants */}
                <FormCard>
                  <SectionHeader title="Category Variants & Sizing Matrix" />

                  <div className="flex flex-col gap-7">
                    {/* Dynamic Variant Options (Sizes / Storage / RAM / Type) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <FieldLabel>
                          {CATEGORY_TREE[form.category]?.sizeLabel || "Available Sizes / Variants"}
                        </FieldLabel>
                        {CATEGORY_TREE[form.category]?.sizeHint && (
                          <span className="text-[11px] text-[#888]">
                            {CATEGORY_TREE[form.category].sizeHint}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {(CATEGORY_TREE[form.category]?.sizeOptions || [
                          "XS", "S", "M", "L", "XL", "XXL"
                        ]).map((s) => (
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
                      {form.colors.length > 0 && (
                        <p className="mt-2 text-xs" style={{ color: "#9a9078" }}>
                          Selected: {form.colors.join(", ")}
                        </p>
                      )}

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
                  <SectionHeader title="Product Images" />

                  {/* Cover image */}
                  <div className="mb-5">
                    <FieldLabel htmlFor="cover-upload">Cover Image * (Primary thumbnail)</FieldLabel>
                    <ImageUploadZone
                      id="cover-upload"
                      label="Drop your cover image here"
                      onFile={handleCoverFile}
                      onRemove={handleRemoveCover}
                      preview={coverPreview}
                    />
                  </div>

                  {/* Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Gallery Images ({galleryFiles.length}/8)</FieldLabel>
                      {galleryFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryFiles([]);
                            setGalleryPreviews([]);
                          }}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div
                      className="grid gap-3"
                      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                    >
                      {/* Uploaded image slots */}
                      {galleryPreviews.map((src, i) => (
                        <div
                          key={i}
                          className="relative rounded group overflow-hidden border border-[#333] bg-[#161616]"
                          style={{ aspectRatio: "1" }}
                        >
                          <img
                            src={src}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-black/70 text-[#f5c518] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            #{i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveGalleryFile(i, e)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Add more button slot */}
                      {galleryFiles.length < 8 && (
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
                      Click &ldquo;+ Add Photos&rdquo; to select 1 or multiple images at once (Up to 8 gallery photos).
                    </p>
                  </div>
                </FormCard>
              </div>

              {/* ── RIGHT: Sticky sidebar ───────────────────────────────────── */}
              <div className="w-80 flex-shrink-0" style={{ position: "sticky", top: "88px" }}>

                {/* Preview card */}
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9a9078", letterSpacing: "0.12em" }}>
                    Live Preview
                  </p>
                  <ProductPreviewCard form={form} coverPreview={coverPreview} />
                </div>

                {/* Completeness checklist */}
                <div className="rounded-lg p-5 mb-5" style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9a9078" }}>
                    Checklist
                  </p>
                  {[
                    { label: "Title", done: form.title.trim().length > 0 },
                    { label: "Category", done: form.category !== "" },
                    { label: "Price", done: form.price !== "" },
                    { label: "Cover image", done: coverFile !== null },
                    { label: "Sizes selected", done: form.sizes.length > 0 },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-3 mb-2.5">
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 18,
                          height: 18,
                          backgroundColor: done ? "#f5c518" : "transparent",
                          border: done ? "1.5px solid #f5c518" : "1.5px solid #3a3a3a",
                        }}
                      >
                        {done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: done ? "#e5e2e1" : "#5a5a5a" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => handleSubmit(e, true)}
                    className="w-full py-3.5 rounded text-sm font-bold uppercase tracking-widest transition-all"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #3a3a3a",
                      color: "#e5e2e1",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1,
                      letterSpacing: "0.1em",
                    }}
                    onMouseEnter={(e) => !isLoading && (e.currentTarget.style.borderColor = "#f5c518")}
                    onMouseLeave={(e) => !isLoading && (e.currentTarget.style.borderColor = "#3a3a3a")}
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded text-sm font-black uppercase tracking-widest transition-all"
                    style={{
                      backgroundColor: "#f5c518",
                      color: "#111111",
                      border: "none",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                      letterSpacing: "0.12em",
                      boxShadow: isLoading ? "none" : "0 4px 20px rgba(245,197,24,0.25)",
                    }}
                    onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = "0 4px 28px rgba(245,197,24,0.45)")}
                    onMouseLeave={(e) => !isLoading && (e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,24,0.25)")}
                  >
                    {isLoading ? "Publishing…" : "Publish Product"}
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-center mt-5 text-xs leading-relaxed" style={{ color: "#4a4a4a" }}>
                  Published products are visible to all buyers instantly. Drafts are only visible to you.
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
