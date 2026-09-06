import React, { useState } from "react";
import { Link } from "react-router";

// ── DATA: Tech Stack Categories ────────────────────────────────────────────────
const TECH_STACK_DATA = {
  frontend: {
    category: "Frontend Layer",
    description: "Modern, high-performance reactive client built on React 19 and Vite.",
    items: [
      {
        name: "React 19",
        version: "^19.2.8",
        badge: "Core Framework",
        color: "#61dafb",
        description: "Latest React features with modern hooks, optimized concurrent rendering, and reactive state hydration.",
        highlights: ["Component-driven architecture", "Custom hooks lifecycle", "Optimized re-renders", "React 19 Actions"],
      },
      {
        name: "Vite 8",
        version: "^8.2.2",
        badge: "Build Tool",
        color: "#646cff",
        description: "Ultra-fast Next-Gen frontend tooling with lightning-fast Hot Module Replacement (HMR) and optimized rollup production bundles.",
        highlights: ["Instant server start", "ESM module resolution", "Zero-config JSX transform", "High-speed bundling"],
      },
      {
        name: "Redux Toolkit & React-Redux",
        version: "^2.12.0 / ^9.3.0",
        badge: "Global State",
        color: "#764abc",
        description: "Centralized predictable state store managing user authentication, persistent cart state, wishlist, and asynchronous thunks.",
        highlights: ["Slices for auth, cart & wishlist", "Local storage synchronization", "Optimistic UI updates", "Centralized dispatch"],
      },
      {
        name: "Tailwind CSS v4",
        version: "^4.3.3",
        badge: "Styling Engine",
        color: "#38bdf8",
        description: "Next-gen CSS framework utilizing the new Vite compiler engine for high-density modern dark streetwear aesthetics.",
        highlights: ["Zero-runtime overhead", "Modern dark theme tokens", "Glassmorphic overlay effects", "Fluid responsive layout"],
      },
      {
        name: "React Router v8",
        version: "^8.3.1",
        badge: "Client Routing",
        color: "#f44250",
        description: "Declarative, client-side routing supporting protected role-based routes, dynamic product slugs, and storefront profiles.",
        highlights: ["ProtectedRoute role guards", "Dynamic parameter matching", "Scroll restoration", "Nested seller/buyer layouts"],
      },
      {
        name: "Axios",
        version: "^1.20.0",
        badge: "HTTP Client",
        color: "#5a29e4",
        description: "Promise-based HTTP client preconfigured with credentials support, automatic cookie serialization, and custom error interceptors.",
        highlights: ["withCredentials: true", "Bearer & cookie token support", "Centralized error handling", "REST API integration"],
      },
      {
        name: "React Razorpay",
        version: "^3.0.1",
        badge: "Payment UI",
        color: "#0c2340",
        description: "Direct Razorpay checkout modal hook allowing frictionless in-app UPI, Netbanking, Cards, and Wallet payments.",
        highlights: ["Seamless checkout modal", "Dynamic order ID injection", "Instant client verification", "Error fallback triggers"],
      },
    ],
  },
  backend: {
    category: "Backend API Layer",
    description: "Enterprise RESTful micro-architecture with Node.js, Express 5, and secure middleware.",
    items: [
      {
        name: "Node.js (ESM)",
        version: "v20+ Native",
        badge: "Runtime",
        color: "#68a063",
        description: "Asynchronous event-driven JavaScript runtime executing server logic in native ES Module syntax.",
        highlights: ["Non-blocking I/O", "Native import/export", "High concurrency throughput", "Cross-platform compatibility"],
      },
      {
        name: "Express 5",
        version: "^5.2.1",
        badge: "Web Framework",
        color: "#ffffff",
        description: "Latest major version of Express featuring built-in native promise rejection handling and modern routing pipelines.",
        highlights: ["Modular route handlers", "Async error propagation", "Custom middleware stack", "RESTful resource endpoints"],
      },
      {
        name: "JWT & Cookie Auth",
        version: "^9.0.3",
        badge: "Security",
        color: "#ff69b4",
        description: "Stateless JSON Web Token authentication paired with secure HTTP-only cookies to prevent XSS and session hijacking.",
        highlights: ["Signed tokens with expiration", "Role claims (buyer/seller/admin)", "HTTP-only cookie storage", "Auth middleware guards"],
      },
      {
        name: "Passport.js & Google OAuth 2.0",
        version: "^0.7.0 / ^2.0.0",
        badge: "Social Identity",
        color: "#4285f4",
        description: "Standardized OAuth 2.0 flow for 1-click Google Sign-in with account linking and automated buyer role provisioning.",
        highlights: ["Federated credential exchange", "Safe role onboarding redirects", "Dual-auth profile linking", "Profile image sync"],
      },
      {
        name: "Multer & Supabase Storage",
        version: "^2.3.0",
        badge: "File Pipeline",
        color: "#3ecf8e",
        description: "Multipart form handler buffering images in memory before uploading directly to Supabase Cloud Storage buckets.",
        highlights: ["Direct bucket upload", "Public asset CDN URLs", "MIME type validation", "Multi-image product drops"],
      },
      {
        name: "Express Validator & Rate Limit",
        version: "^7.3.2 / ^8.7.0",
        badge: "API Defense",
        color: "#f59e0b",
        description: "Strict payload sanitization, type assertion, and IP rate limiting protecting authentication and checkout endpoints from DDoS.",
        highlights: ["Schema validation rules", "Brute-force mitigation", "Sanitized inputs", "Standardized error envelopes"],
      },
      {
        name: "Razorpay Node SDK",
        version: "^2.9.8",
        badge: "Payments Engine",
        color: "#0284c7",
        description: "Server-side payment order generation and cryptographic HMAC-SHA256 signature verification for zero-fraud order fulfillment.",
        highlights: ["Order creation API", "Cryptographic signature validation", "Webhook readiness", "Currency handling (INR)"],
      },
    ],
  },
  database: {
    category: "Database & Cloud Infrastructure",
    description: "PostgreSQL Database with Supabase BaaS, Row Level Security, and Cloud Object Storage.",
    items: [
      {
        name: "Supabase PostgreSQL",
        version: "^2.50.3",
        badge: "Database",
        color: "#3ecf8e",
        description: "Fully managed PostgreSQL instance powering ACID transactions, foreign key constraints, JSONB attributes, and high availability.",
        highlights: ["Relational integrity", "JSONB variant matrices", "Automated timestamps", "Indexed queries for search"],
      },
      {
        name: "Row Level Security (RLS)",
        version: "Postgres Native",
        badge: "Data Isolation",
        color: "#10b981",
        description: "Database-level security policies ensuring sellers can only modify their own products/orders and buyers access only their own data.",
        highlights: ["Multi-tenant isolation", "Granular read/write policies", "Bypass service keys for backend", "Zero data leakage"],
      },
      {
        name: "Supabase Storage Buckets",
        version: "S3 Compatible",
        badge: "Cloud Media",
        color: "#059669",
        description: "Global cloud storage bucket `product-images` hosting high-resolution product thumbnails, variant lookbooks, and seller logos.",
        highlights: ["Public CDN delivery", "Custom asset keys", "Optimized media delivery", "Automated CORS headers"],
      },
    ],
  },
};

// ── DATA: System Models Breakdown ──────────────────────────────────────────────
const MODELS_DATA = [
  {
    id: "user",
    name: "User Model",
    icon: "👤",
    table: "users",
    description: "Core identity and authentication model managing buyers, sellers, administrators, credentials, and OAuth connections.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique user identifier" },
      { name: "email", type: "VARCHAR(255)", desc: "Unique user email address" },
      { name: "password_hash", type: "VARCHAR(255)", desc: "BCrypt hashed password (10 salt rounds)" },
      { name: "name", type: "VARCHAR(100)", desc: "User full display name" },
      { name: "role", type: "VARCHAR(20)", desc: "Enum: 'buyer' | 'seller' | 'admin'" },
      { name: "google_id", type: "VARCHAR(255)", desc: "Nullable Google OAuth federated ID" },
      { name: "avatar_url", type: "TEXT", desc: "User profile image or OAuth avatar" },
      { name: "created_at", type: "TIMESTAMPTZ", desc: "Account creation timestamp" },
    ],
    relationships: ["1:1 with Sellers (if role = seller)", "1:N with Orders", "1:N with Cart Items", "1:N with Reviews"],
  },
  {
    id: "seller",
    name: "Seller & Brand Model",
    icon: "🏬",
    table: "sellers",
    description: "Vendor profile model containing brand storefront data, verification status, GST details, and store slugs.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique seller record identifier" },
      { name: "user_id", type: "UUID / INT", desc: "Foreign key reference to users.id" },
      { name: "store_name", type: "VARCHAR(150)", desc: "Public store/brand name" },
      { name: "slug", type: "VARCHAR(150)", desc: "URL-friendly store handle (e.g. /store/snitch-urban)" },
      { name: "description", type: "TEXT", desc: "Brand biography and description" },
      { name: "logo_url", type: "TEXT", desc: "Brand storefront avatar image" },
      { name: "banner_url", type: "TEXT", desc: "Storefront header hero banner" },
      { name: "status", type: "VARCHAR(20)", desc: "Enum: 'pending' | 'verified' | 'rejected'" },
      { name: "gst_number", type: "VARCHAR(50)", desc: "Tax & business identification number" },
    ],
    relationships: ["Belongs to User (1:1)", "1:N with Products", "1:N with Analytics Events"],
  },
  {
    id: "product",
    name: "Product & Variants Model",
    icon: "👕",
    table: "products",
    description: "Multi-dimensional catalog model supporting department hierarchies, color-based pricing, and matrix SKU stock tracking.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique product identifier" },
      { name: "seller_id", type: "UUID / INT", desc: "Foreign key reference to sellers.id" },
      { name: "title", type: "VARCHAR(255)", desc: "Product title / drop name" },
      { name: "slug", type: "VARCHAR(255)", desc: "SEO-friendly product URL slug" },
      { name: "description", type: "TEXT", desc: "Rich product description and fabric specs" },
      { name: "base_price", type: "DECIMAL(10,2)", desc: "Default baseline retail price" },
      { name: "discount_percent", type: "INT", desc: "Promotional discount percentage" },
      { name: "department", type: "VARCHAR(50)", desc: "e.g. 'men', 'women', 'unisex'" },
      { name: "category", type: "VARCHAR(50)", desc: "e.g. 'clothing', 'footwear', 'streetwear'" },
      { name: "subcategory", type: "VARCHAR(50)", desc: "e.g. 't-shirts', 'cargos', 'sneakers'" },
      { name: "images", type: "TEXT[] (ARRAY)", desc: "Array of Supabase CDN image URLs" },
      { name: "color_prices", type: "JSONB", desc: "Dynamic color-specific pricing mappings" },
      { name: "variants_matrix", type: "JSONB", desc: "Array of { size, color, stock, sku, price }" },
      { name: "is_published", type: "BOOLEAN", desc: "Catalog visibility status" },
    ],
    relationships: ["Belongs to Seller (N:1)", "1:N with Order Items", "1:N with Cart Items", "1:N with Reviews"],
  },
  {
    id: "cart",
    name: "Cart & Bag Model",
    icon: "🛍️",
    table: "cart_items",
    description: "Hybrid shopping bag model supporting instant localStorage client sync with persistent Supabase DB storage.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique cart item record ID" },
      { name: "user_id", type: "UUID / INT", desc: "Foreign key reference to users.id" },
      { name: "product_id", type: "UUID / INT", desc: "Foreign key reference to products.id" },
      { name: "size", type: "VARCHAR(20)", desc: "Selected variant size (e.g. 'S', 'M', 'L', 'XL')" },
      { name: "color", type: "VARCHAR(50)", desc: "Selected variant color name / hex" },
      { name: "quantity", type: "INT", desc: "Quantity count chosen by buyer" },
      { name: "updated_at", type: "TIMESTAMPTZ", desc: "Last modification timestamp" },
    ],
    relationships: ["Belongs to User (N:1)", "References Product (N:1)"],
  },
  {
    id: "order",
    name: "Order & Payment Model",
    icon: "📦",
    table: "orders / order_items",
    description: "End-to-end commerce transaction model managing Razorpay orders, payment signatures, and order fulfillment states.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique internal order ID" },
      { name: "user_id", type: "UUID / INT", desc: "Foreign key reference to users.id" },
      { name: "razorpay_order_id", type: "VARCHAR(100)", desc: "Razorpay Gateway Order identifier" },
      { name: "razorpay_payment_id", type: "VARCHAR(100)", desc: "Verified transaction payment ID" },
      { name: "total_amount", type: "DECIMAL(10,2)", desc: "Total paid amount in INR" },
      { name: "status", type: "VARCHAR(30)", desc: "Enum: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'" },
      { name: "payment_status", type: "VARCHAR(30)", desc: "Enum: 'pending' | 'paid' | 'failed'" },
      { name: "shipping_address", type: "JSONB", desc: "Recipient name, street, city, pin, phone" },
      { name: "created_at", type: "TIMESTAMPTZ", desc: "Order creation timestamp" },
    ],
    relationships: ["Belongs to User (N:1)", "1:N with Order Items (split across sellers)"],
  },
  {
    id: "review",
    name: "Verified Reviews Model",
    icon: "⭐",
    table: "reviews",
    description: "Customer rating and review model with verified purchase validation and automatic product rating aggregation.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique review record ID" },
      { name: "product_id", type: "UUID / INT", desc: "Foreign key reference to products.id" },
      { name: "user_id", type: "UUID / INT", desc: "Foreign key reference to users.id" },
      { name: "rating", type: "INT", desc: "1 to 5 star rating score" },
      { name: "title", type: "VARCHAR(150)", desc: "Review summary title" },
      { name: "comment", type: "TEXT", desc: "Detailed buyer feedback" },
      { name: "is_verified_purchase", type: "BOOLEAN", desc: "Verified order check status" },
    ],
    relationships: ["References Product (N:1)", "References User (N:1)"],
  },
  {
    id: "analytics",
    name: "Live Analytics Model",
    icon: "📈",
    table: "analytics_events",
    description: "Event telemetry model capturing page hits, product views, add-to-carts, and merchant revenue conversions.",
    fields: [
      { name: "id", type: "UUID / INT", isPk: true, desc: "Unique event log identifier" },
      { name: "event_name", type: "VARCHAR(50)", desc: "Enum: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase'" },
      { name: "seller_id", type: "UUID / INT", desc: "Seller store impacted by event" },
      { name: "product_id", type: "UUID / INT", desc: "Product associated with event" },
      { name: "metadata", type: "JSONB", desc: "Device, revenue amount, referral source" },
      { name: "created_at", type: "TIMESTAMPTZ", desc: "Timestamp of event occurrence" },
    ],
    relationships: ["References Seller (N:1)", "References Product (N:1)"],
  },
];

// ── DATA: System Architecture Workflow Steps ──────────────────────────────────
const WORKFLOWS = [
  {
    title: "1. Authentication & Session Hydration",
    icon: "🔐",
    tag: "Security Flow",
    steps: [
      "User submits login form or clicks 'Sign in with Google OAuth'.",
      "Backend validates credentials with BCrypt or exchanges OAuth 2.0 authorization code.",
      "Express signs a high-entropy JWT containing userId and role, and attaches it as an HTTP-Only secure cookie.",
      "Frontend `AuthHydrator` in `App.jsx` fires `GET /api/auth/me` on initial page load.",
      "Redux Auth Slice receives user state, and `cart.slice` triggers cart synchronization.",
    ],
  },
  {
    title: "2. Multi-Vendor Catalog & Dynamic Variant Engine",
    icon: "🎨",
    tag: "Catalog Flow",
    steps: [
      "Sellers upload product metadata, high-res images to Supabase Storage, and configure the Variants Matrix.",
      "Color-specific prices and size/stock combinations are saved in PostgreSQL JSONB fields.",
      "Buyers browse the interactive catalog with dynamic synonym expansion and hierarchical category filtering.",
      "Product Details Page dynamically updates price, image gallery, and stock status based on selected Color & Size.",
    ],
  },
  {
    title: "3. Persistent Cart Hybrid Hydration",
    icon: "🛒",
    tag: "State Flow",
    steps: [
      "Guest users add items to bag; items are stored in browser `localStorage` (`snitch_shopping_bag_v1`).",
      "Upon user login or registration, Redux dispatches `syncCart(localItems)`.",
      "Backend bulk-merges local guest items into the PostgreSQL `cart_items` table under the user's ID.",
      "Cart drawer reflects live real-time subtotal, discounts, and item counts across tabs.",
    ],
  },
  {
    title: "4. Checkout & Cryptographic Payment Flow",
    icon: "💳",
    tag: "Payment Flow",
    steps: [
      "Buyer enters shipping address and initiates checkout.",
      "Backend calls Razorpay API to generate a server-signed `order_id` in INR currency.",
      "Frontend invokes the `react-razorpay` modal allowing payment via UPI, Card, or Netbanking.",
      "Razorpay returns `razorpay_payment_id` and `razorpay_signature` upon success.",
      "Backend verifies the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`. Upon confirmation, order status updates to 'paid'.",
    ],
  },
];

export default function TechStackModelPage() {
  const [activeTab, setActiveTab] = useState("stack"); // 'stack' | 'models' | 'workflows' | 'schema'
  const [selectedModel, setSelectedModel] = useState(MODELS_DATA[0]);
  const [activeStackCategory, setActiveStackCategory] = useState("all");

  const filteredStack = Object.entries(TECH_STACK_DATA).flatMap(([catKey, cat]) => {
    if (activeStackCategory !== "all" && activeStackCategory !== catKey) return [];
    return cat.items.map((item) => ({ ...item, categoryName: cat.category }));
  });

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e5e2e1] font-sans selection:bg-[#f5c518] selection:text-black">
      {/* ── Top Header / Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#111111]/90 backdrop-blur-md border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl font-black tracking-widest text-[#f5c518] group-hover:scale-105 transition-transform">
                SNITCH
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30">
                ARCH // V1.0
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-semibold text-[#9a9078] hover:text-[#f5c518] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Marketplace
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-[#1f1f1f] bg-gradient-to-b from-[#141414] to-[#0d0d0d]">
        <div className="absolute inset-0 bg-[radial-gradient(#f5c518_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5c518]/10 border border-[#f5c518]/30 text-[#f5c518] text-xs font-bold uppercase tracking-widest mb-4">
            <span>⚡ Full System Blueprint & Technical Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase mb-4">
            SNITCH <span className="text-[#f5c518]">TECH STACK</span> & DATA MODELS
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base text-[#9a9078] leading-relaxed mb-8">
            An in-depth, production-ready blueprint of the multi-vendor e-commerce platform. Explore full-stack technologies, relational database models, state hydration pipelines, and payment processing workflows.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] text-left">
              <span className="text-xs text-[#9a9078] font-bold uppercase tracking-wider block mb-1">Frontend Core</span>
              <p className="text-lg font-black text-white">React 19 + Vite 8</p>
              <span className="text-[11px] text-[#38bdf8]">Tailwind v4 & Redux</span>
            </div>

            <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] text-left">
              <span className="text-xs text-[#9a9078] font-bold uppercase tracking-wider block mb-1">API Backend</span>
              <p className="text-lg font-black text-white">Node.js + Express 5</p>
              <span className="text-[11px] text-[#68a063]">RESTful Micro-routing</span>
            </div>

            <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] text-left">
              <span className="text-xs text-[#9a9078] font-bold uppercase tracking-wider block mb-1">Database & Storage</span>
              <p className="text-lg font-black text-white">Supabase PostgreSQL</p>
              <span className="text-[11px] text-[#3ecf8e]">Postgres RLS & S3 Bucket</span>
            </div>

            <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] text-left">
              <span className="text-xs text-[#9a9078] font-bold uppercase tracking-wider block mb-1">Payments & Auth</span>
              <p className="text-lg font-black text-white">Razorpay + JWT OAuth</p>
              <span className="text-[11px] text-[#f5c518]">HMAC-SHA256 & Cookies</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ──────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-[#111111]/95 backdrop-blur border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-2.5">
          <div className="flex gap-2">
            {[
              { id: "stack", label: "Full Tech Stack", icon: "⚡" },
              { id: "models", label: "Data Models (7 Core)", icon: "📊" },
              { id: "workflows", label: "System Architecture Flow", icon: "🔄" },
              { id: "schema", label: "Interactive SQL Schema", icon: "🗄️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#f5c518] text-[#111111] shadow-lg shadow-[#f5c518]/20"
                    : "bg-[#1a1a1a] text-[#a09c95] hover:text-white hover:bg-[#252525]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ─── TAB 1: TECH STACK BLUEPRINT ──────────────────────────────────── */}
        {activeTab === "stack" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#222222]">
              <div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                  Technology Stack Ecosystem
                </h2>
                <p className="text-xs text-[#9a9078] mt-1">
                  Complete list of frameworks, libraries, cloud infrastructure, and security tools powering SNITCH.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                {[
                  { id: "all", label: "All Layers" },
                  { id: "frontend", label: "Frontend" },
                  { id: "backend", label: "Backend API" },
                  { id: "database", label: "Database / Cloud" },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setActiveStackCategory(btn.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      activeStackCategory === btn.id
                        ? "bg-white text-black font-bold"
                        : "bg-[#1c1c1c] text-[#9a9078] hover:text-white"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Tech Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStack.map((tech, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-2xl bg-[#141414] border border-[#222222] hover:border-[#f5c518]/50 transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-[#f5c518]/5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#f5c518]">
                          {tech.categoryName}
                        </span>
                        <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                          {tech.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#202020] text-[#a09c95] border border-[#333]">
                        {tech.version}
                      </span>
                    </div>

                    <p className="text-xs text-[#b5b0a3] leading-relaxed mb-4">
                      {tech.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-3 border-t border-[#202020]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7465] block mb-2">
                        Key Capabilities:
                      </span>
                      <ul className="space-y-1">
                        {tech.highlights.map((h, hi) => (
                          <li key={hi} className="text-[11px] text-[#e0ded8] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c518]" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 2: DATA MODELS ───────────────────────────────────────────── */}
        {activeTab === "models" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                7 Core System Models & Database Schemas
              </h2>
              <p className="text-xs text-[#9a9078] mt-1">
                Relational entity models, JSONB structures, foreign key constraints, and business logic bindings.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Model Selector List */}
              <div className="lg:col-span-4 space-y-2">
                {MODELS_DATA.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedModel.id === model.id
                        ? "bg-[#1c1c1c] border-[#f5c518] shadow-lg shadow-[#f5c518]/10"
                        : "bg-[#141414] border-[#222222] hover:border-[#383838]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{model.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{model.name}</h4>
                        <span className="text-[11px] font-mono text-[#f5c518]">table: {model.table}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#7a7465]">→</span>
                  </button>
                ))}
              </div>

              {/* Right Column: Selected Model Details & Schema Table */}
              <div className="lg:col-span-8 p-6 rounded-2xl bg-[#141414] border border-[#222222]">
                <div className="flex items-center justify-between pb-4 border-b border-[#222222] mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedModel.icon}</span>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {selectedModel.name}
                      </h3>
                      <p className="text-xs text-[#f5c518] font-mono">
                        POSTGRES TABLE: {selectedModel.table}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#b5b0a3] leading-relaxed mb-6">
                  {selectedModel.description}
                </p>

                {/* Fields Table */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                  Attributes & Schema Types
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#262626] mb-6">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#1c1c1c] text-[#a09c95] uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Field Name</th>
                        <th className="p-3">Data Type</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {selectedModel.fields.map((f, fi) => (
                        <tr key={fi} className="hover:bg-[#181818]">
                          <td className="p-3 font-mono font-bold text-[#f5c518] flex items-center gap-1.5">
                            {f.isPk && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-[#f5c518]/20 text-[#f5c518] font-sans">
                                PK
                              </span>
                            )}
                            {f.name}
                          </td>
                          <td className="p-3 font-mono text-[#38bdf8] text-[11px]">{f.type}</td>
                          <td className="p-3 text-[#b5b0a3]">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Relationships */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                    Entity Relationships
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.relationships.map((rel, ri) => (
                      <span
                        key={ri}
                        className="px-3 py-1 rounded-lg bg-[#1e1e1e] border border-[#333] text-[11px] text-[#e0ded8]"
                      >
                        🔗 {rel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: WORKFLOWS & ARCHITECTURE FLOW ─────────────────────────── */}
        {activeTab === "workflows" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                End-to-End System Architecture Workflows
              </h2>
              <p className="text-xs text-[#9a9078] mt-1">
                Visualizing how data flows from the browser UI, through Express middleware, to Supabase & Razorpay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WORKFLOWS.map((wf, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#141414] border border-[#222222] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{wf.icon}</span>
                        <h3 className="text-base font-bold text-white">{wf.title}</h3>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/20">
                        {wf.tag}
                      </span>
                    </div>

                    <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#282828]">
                      {wf.steps.map((step, sIdx) => (
                        <div key={sIdx} className="relative flex items-start gap-3">
                          <span className="w-3 h-3 rounded-full bg-[#f5c518] border-2 border-[#141414] mt-0.5 flex-shrink-0 -ml-[22px]" />
                          <p className="text-xs text-[#b5b0a3] leading-relaxed">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 4: INTERACTIVE SQL SCHEMA ────────────────────────────────── */}
        {activeTab === "schema" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                Production Database Migrations (PostgreSQL)
              </h2>
              <p className="text-xs text-[#9a9078] mt-1">
                Live SQL schema statements defining tables, indexes, constraints, and JSONB columns.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-[#222222] font-mono text-xs text-[#d1d5db] overflow-x-auto space-y-6">
              <div>
                <span className="text-[#f5c518] font-bold block mb-2">-- 1. Users Table</span>
                <pre className="text-[#9ca3af] bg-[#0c0c0c] p-4 rounded-xl border border-[#222]">
{`CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  google_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>

              <div>
                <span className="text-[#f5c518] font-bold block mb-2">-- 2. Sellers & Storefronts Table</span>
                <pre className="text-[#9ca3af] bg-[#0c0c0c] p-4 rounded-xl border border-[#222]">
{`CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  store_name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  gst_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>

              <div>
                <span className="text-[#f5c518] font-bold block mb-2">-- 3. Products with Multi-Variant Matrix & Color Prices</span>
                <pre className="text-[#9ca3af] bg-[#0c0c0c] p-4 rounded-xl border border-[#222]">
{`CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES sellers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  department VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  images TEXT[] DEFAULT '{}',
  color_prices JSONB DEFAULT '{}',
  variants_matrix JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_category ON products(department, category, subcategory);`}
                </pre>
              </div>

              <div>
                <span className="text-[#f5c518] font-bold block mb-2">-- 4. Orders & Payment Transactions</span>
                <pre className="text-[#9ca3af] bg-[#0c0c0c] p-4 rounded-xl border border-[#222]">
{`CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  razorpay_order_id VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'placed',
  payment_status VARCHAR(30) DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-[#1f1f1f] py-8 bg-[#0c0c0c] text-center text-xs text-[#7a7465]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SNITCH Streetwear Marketplace. Built with React 19, Vite 8, Express 5, and Supabase.</p>
          <Link to="/" className="text-[#f5c518] hover:underline font-bold">
            ← Back to Marketplace
          </Link>
        </div>
      </footer>
    </div>
  );
}
