/**
 * Amazon / Flipkart Style Multi-Level Category Hierarchy
 * Gender / Department > Main Category > Subcategory
 */

export const DEPARTMENTS = [
  { id: "Men", label: "Men's Collection", icon: "🕶️" },
  { id: "Women", label: "Women's Collection", icon: "✨" },
  { id: "Unisex", label: "Unisex / Genderless", icon: "⚡" },
];

export const CATEGORY_TREE = {
  footwear: {
    id: "footwear",
    label: "Footwear & Shoes",
    icon: "👟",
    tag: "KICKS",
    sizeType: "shoe",
    sizeLabel: "Shoe Sizes (UK / India)",
    sizeHint: "Standard Indian/UK sneaker and formal shoe sizes",
    sizeOptions: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
    subcategories: [
      { id: "sneakers", label: "Sneakers" },
      { id: "casual-shoes", label: "Casual Shoes" },
      { id: "formal-shoes", label: "Formal Shoes" },
      { id: "running-shoes", label: "Running & Sports Shoes" },
      { id: "slides-sandals", label: "Slides & Sandals" },
      { id: "boots", label: "Boots" },
      { id: "loafers", label: "Loafers" },
    ],
  },
  clothing: {
    id: "clothing",
    label: "Clothing & Apparel",
    icon: "👕",
    tag: "FASHION",
    sizeType: "apparel",
    sizeLabel: "Available Garment Sizes",
    sizeHint: "Standard Indian sizing for tops, tees, hoodies, and bottoms",
    sizeOptions: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"],
    subcategories: [
      { id: "oversized-tshirts", label: "Oversized T-Shirts" },
      { id: "classic-tshirts", label: "Classic T-Shirts" },
      { id: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
      { id: "shirts", label: "Casual & Formal Shirts" },
      { id: "jeans-denim", label: "Jeans & Denim" },
      { id: "cargo-pants", label: "Cargo Pants" },
      { id: "trousers-chinos", label: "Trousers & Chinos" },
      { id: "jackets-coats", label: "Jackets & Coats" },
      { id: "shorts", label: "Shorts" },
      { id: "dresses", label: "Dresses & Jumpsuits" },
      { id: "crop-tops", label: "Tops & Crop Tops" },
    ],
  },
  streetwear: {
    id: "streetwear",
    label: "Streetwear Drops",
    icon: "🔥",
    tag: "EXCLUSIVE",
    sizeType: "streetwear",
    sizeLabel: "Streetwear Drop Sizing",
    sizeHint: "Oversized & relaxed drop cut",
    sizeOptions: ["XS", "S", "M", "L", "XL", "XXL"],
    subcategories: [
      { id: "graphic-tees", label: "Limited Graphic Tees" },
      { id: "acid-wash-hoodies", label: "Acid Wash Hoodies" },
      { id: "baggy-cargos", label: "Baggy Cargo Denim" },
      { id: "bomber-jackets", label: "Bomber & Varsity Jackets" },
      { id: "utility-vests", label: "Utility & Tactical Vests" },
      { id: "track-pants", label: "Track Pants & Joggers" },
    ],
  },
  electronics: {
    id: "electronics",
    label: "Electronics & Gadgets",
    icon: "💻",
    tag: "TECH",
    sizeType: "tech",
    sizeLabel: "Configuration / Edition",
    sizeHint: "Select storage, memory, or model configuration",
    sizeOptions: ["Standard", "Pro / ANC", "64GB", "128GB", "256GB", "512GB", "1TB", "8GB RAM", "16GB RAM", "32GB RAM"],
    subcategories: [
      { id: "smartwatches", label: "Smartwatches" },
      { id: "earbuds", label: "Wireless Earbuds (TWS)" },
      { id: "headphones", label: "Over-Ear Headphones" },
      { id: "speakers", label: "Bluetooth Speakers" },
      { id: "chargers-powerbanks", label: "Power Banks & Fast Chargers" },
      { id: "smart-accessories", label: "Smart Accessories" },
    ],
  },
  accessories: {
    id: "accessories",
    label: "Accessories & Audio",
    icon: "🎧",
    tag: "GEAR",
    sizeType: "accessory",
    sizeLabel: "Size / Variant",
    sizeHint: "Standard or adjustable accessory options",
    sizeOptions: ["Standard", "One Size", "Adjustable", "Small", "Medium", "Large"],
    subcategories: [
      { id: "sunglasses", label: "Sunglasses & Eyewear" },
      { id: "caps-hats", label: "Caps, Beanies & Hats" },
      { id: "wallets-belts", label: "Leather Wallets & Belts" },
      { id: "backpacks", label: "Backpacks & Crossbody Bags" },
      { id: "jewelry", label: "Chains, Rings & Jewelry" },
      { id: "fragrances", label: "Perfumes & Fragrances" },
    ],
  },
};

export const COLOR_OPTIONS = [
  { label: "Obsidian Black", hex: "#0a0a0a" },
  { label: "Arctic White", hex: "#f0ede8" },
  { label: "Space Grey", hex: "#4b4d52" },
  { label: "Titanium Silver", hex: "#8c8e94" },
  { label: "Snitch Gold", hex: "#f5c518" },
  { label: "Olive Drab", hex: "#4b5320" },
  { label: "Navy Blue", hex: "#1b2a4a" },
  { label: "Crimson Red", hex: "#8b1e1e" },
  { label: "Mocha Brown", hex: "#5c4033" },
  { label: "Sage Green", hex: "#879b83" },
  { label: "Lavender Frost", hex: "#a79cb8" },
];

/**
 * Format category key to human readable display string
 */
export function formatCategoryName(cat) {
  if (!cat) return "General";
  const found = CATEGORY_TREE[cat.toLowerCase()];
  if (found) return found.label;
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

/**
 * Find subcategory label given category and subcategory id
 */
export function formatSubcategoryName(category, subcategoryId) {
  if (!category || !subcategoryId) return "";
  const cat = CATEGORY_TREE[category.toLowerCase()];
  if (!cat) return subcategoryId;
  const sub = cat.subcategories.find((s) => s.id === subcategoryId);
  return sub ? sub.label : subcategoryId;
}
