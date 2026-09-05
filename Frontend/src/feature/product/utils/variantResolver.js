/**
 * Resolves active product attributes against the multi-attribute variant matrix.
 * Applies the Smart Fallback Principle: If an attribute (price, compare_at_price, stock, sku, image)
 * is not explicitly specified on the variant, it inherits from the main product's default values.
 *
 * @param {Object} product - The main product object
 * @param {Object} selectedAttributes - Key-value pair of selected attributes, e.g. { size: "XL", color: "Obsidian Black" }
 * @returns {Object} Normalized resolved variant info with fallback values
 */
export function resolveVariant(product, selectedAttributes = {}) {
  if (!product) {
    return {
      variant: null,
      price: 0,
      compareAtPrice: null,
      stock: 0,
      sku: null,
      imageUrl: null,
      hasCustomPrice: false,
    };
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const basePrice = Number(product.price) || 0;
  const baseCompareAt = product.compare_at_price ? Number(product.compare_at_price) : null;
  const baseStock = product.stock !== undefined && product.stock !== null ? Number(product.stock) : 0;
  const baseSku = product.sku || null;
  const baseImage = product.cover_image_url || null;

  // 1. Try to find an exact matching variant in the multi-attribute matrix
  const matchedVariant = variants.find((v) => {
    if (!v || !v.attributes || typeof v.attributes !== "object") return false;
    return Object.entries(selectedAttributes).every(([attrKey, selectedVal]) => {
      if (!selectedVal) return true;
      const vVal = v.attributes[attrKey];
      if (!vVal) return false;
      return String(vVal).trim().toLowerCase() === String(selectedVal).trim().toLowerCase();
    });
  });

  // 2. Check legacy / single color override as fallback if no full matrix match
  const selectedColor = selectedAttributes.color || selectedAttributes.Color;
  const colorPriceEntry = selectedColor && product.color_prices ? product.color_prices[selectedColor] : null;
  const colorOverridePrice = colorPriceEntry
    ? (typeof colorPriceEntry === "object" ? colorPriceEntry.price : colorPriceEntry)
    : null;
  const colorOverrideCompare = colorPriceEntry && typeof colorPriceEntry === "object" && colorPriceEntry.compare_at_price
    ? colorPriceEntry.compare_at_price
    : null;

  // 3. Resolve Price (Variant override -> Color override -> Main Product default)
  let resolvedPrice = basePrice;
  if (matchedVariant && matchedVariant.price !== null && matchedVariant.price !== undefined && matchedVariant.price !== "" && !isNaN(matchedVariant.price)) {
    resolvedPrice = Number(matchedVariant.price);
  } else if (colorOverridePrice !== null && colorOverridePrice !== undefined && colorOverridePrice !== "" && !isNaN(colorOverridePrice)) {
    resolvedPrice = Number(colorOverridePrice);
  }

  // 4. Resolve Compare At Price / MRP
  let resolvedCompareAt = baseCompareAt;
  if (matchedVariant && matchedVariant.compare_at_price !== null && matchedVariant.compare_at_price !== undefined && matchedVariant.compare_at_price !== "" && !isNaN(matchedVariant.compare_at_price)) {
    resolvedCompareAt = Number(matchedVariant.compare_at_price);
  } else if (colorOverrideCompare !== null && colorOverrideCompare !== undefined && colorOverrideCompare !== "" && !isNaN(colorOverrideCompare)) {
    resolvedCompareAt = Number(colorOverrideCompare);
  }

  // 5. Resolve Stock Qty
  let resolvedStock = baseStock;
  if (matchedVariant && matchedVariant.stock !== null && matchedVariant.stock !== undefined && matchedVariant.stock !== "" && !isNaN(matchedVariant.stock)) {
    resolvedStock = Number(matchedVariant.stock);
  }

  // 6. Resolve SKU & Image
  const resolvedSku = matchedVariant?.sku || baseSku;
  const resolvedImage = matchedVariant?.image_url || baseImage;

  return {
    variant: matchedVariant || null,
    price: resolvedPrice,
    compareAtPrice: resolvedCompareAt,
    stock: resolvedStock,
    sku: resolvedSku,
    imageUrl: resolvedImage,
    hasCustomPrice: resolvedPrice !== basePrice,
    hasCustomStock: resolvedStock !== baseStock,
  };
}

/**
 * Generates Cartesian product combinations for Seller Studio matrix editor.
 * Retains existing custom values for existing matching combinations.
 */
export function generateVariantCombinations(sizes = [], colors = [], existingVariants = []) {
  if (sizes.length === 0 && colors.length === 0) return [];

  const existingMap = new Map();
  if (Array.isArray(existingVariants)) {
    existingVariants.forEach((v) => {
      if (v && v.attributes) {
        const key = `${v.attributes.size || ""}::${v.attributes.color || ""}`.toLowerCase();
        existingMap.set(key, v);
      }
    });
  }

  const combinations = [];

  // Case A: Both Sizes and Colors selected
  if (sizes.length > 0 && colors.length > 0) {
    sizes.forEach((s) => {
      colors.forEach((c) => {
        const key = `${s}::${c}`.toLowerCase();
        const existing = existingMap.get(key);
        combinations.push({
          id: existing?.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          attributes: { size: s, color: c },
          price: existing?.price !== undefined ? existing.price : "",
          compare_at_price: existing?.compare_at_price !== undefined ? existing.compare_at_price : "",
          stock: existing?.stock !== undefined ? existing.stock : "",
          sku: existing?.sku || "",
        });
      });
    });
  } 
  // Case B: Only Sizes selected
  else if (sizes.length > 0) {
    sizes.forEach((s) => {
      const key = `${s}::`.toLowerCase();
      const existing = existingMap.get(key);
      combinations.push({
        id: existing?.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        attributes: { size: s },
        price: existing?.price !== undefined ? existing.price : "",
        compare_at_price: existing?.compare_at_price !== undefined ? existing.compare_at_price : "",
        stock: existing?.stock !== undefined ? existing.stock : "",
        sku: existing?.sku || "",
      });
    });
  } 
  // Case C: Only Colors selected
  else if (colors.length > 0) {
    colors.forEach((c) => {
      const key = `::${c}`.toLowerCase();
      const existing = existingMap.get(key);
      combinations.push({
        id: existing?.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        attributes: { color: c },
        price: existing?.price !== undefined ? existing.price : "",
        compare_at_price: existing?.compare_at_price !== undefined ? existing.compare_at_price : "",
        stock: existing?.stock !== undefined ? existing.stock : "",
        sku: existing?.sku || "",
      });
    });
  }

  return combinations;
}
