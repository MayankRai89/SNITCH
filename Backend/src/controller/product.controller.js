import ProductModel from "../model/product.model.js";
import SellerModel from "../model/seller.model.js";
import SnitchModel from "../model/user.model.js";
import { uploadImageToStorage, uploadMultipleImages } from "../service/storage.service.js";

/**
 * Helper to convert title into URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")           // Replace spaces and underscores with -
    .replace(/[^\w-]+/g, "")           // Remove all non-word chars
    .replace(/--+/g, "-")              // Replace multiple - with single -
    .replace(/^-+/, "")                // Trim - from start of text
    .replace(/-+$/, "");               // Trim - from end of text
}

/**
 * Safe JSON parser helper to prevent 500 errors on malformed payloads
 */
function safeJsonParse(val, fallback) {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/**
 * Ensure seller profile exists for the user; auto-creates if needed
 */
async function getOrEnsureSeller(userId) {
  let seller = await SellerModel.findByUserId(userId);
  if (!seller) {
    const user = await SnitchModel.findById(userId);
    const storeName = user?.full_name ? `${user.full_name}'s Store` : "Seller Store";
    let baseSlug = slugify(storeName || "seller-store");
    let storeSlug = baseSlug;
    let counter = 1;
    while (await SellerModel.isSlugTaken(storeSlug)) {
      storeSlug = `${baseSlug}-${counter++}`;
    }
    seller = await SellerModel.create({
      user_id: userId,
      store_name: storeName,
      store_slug: storeSlug,
      business_type: "individual",
      verification_status: "verified",
      onboarding_step: 3,
      is_active: true,
    });
  }
  return seller;
}

/**
 * POST /api/products
 * Create a new product with image uploads to Supabase Storage
 */
export async function createProduct(req, res) {
  try {
    const userId = req.user.id;

    // 1. Verify / ensure seller profile
    const seller = await getOrEnsureSeller(userId);

    const {
      title,
      description,
      category,
      price,
      compare_at_price,
      stock = 0,
      sku,
      sizes,
      colors,
      tags,
      color_prices,
      variants,
      is_active,
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and price are required.",
      });
    }

    const numPrice = parseFloat(price);
    const hasCompareAtPrice = compare_at_price !== undefined && compare_at_price !== null && String(compare_at_price).trim() !== "";
    const numCompareAtPrice = hasCompareAtPrice ? parseFloat(compare_at_price) : null;

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number.",
      });
    }

    if (numCompareAtPrice !== null && (isNaN(numCompareAtPrice) || numCompareAtPrice < numPrice)) {
      return res.status(400).json({
        success: false,
        message: "Compare at price (MRP / Original Price) must be greater than or equal to the selling price.",
      });
    }

    // 2. Handle image files from Multer
    const files = req.files || {};
    const coverFile = files.coverImage?.[0];
    const galleryFiles = files.galleryImages || [];

    if (!coverFile && !req.body.cover_image_url) {
      return res.status(400).json({
        success: false,
        message: "A cover image is required for every product.",
      });
    }

    // Upload cover image to Supabase Storage if file is uploaded
    let cover_image_url = req.body.cover_image_url;
    if (coverFile) {
      cover_image_url = await uploadImageToStorage(
        coverFile.buffer,
        coverFile.originalname,
        coverFile.mimetype,
        `seller_${seller.id}`
      );
    }

    // Upload gallery images to Supabase Storage if files are uploaded
    let images = [];
    if (galleryFiles.length > 0) {
      images = await uploadMultipleImages(galleryFiles, `seller_${seller.id}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // 3. Generate unique slug
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await ProductModel.isSlugTaken(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // 4. Parse array and object fields (if sent as JSON strings via FormData)
    const parsedSizes = safeJsonParse(sizes, []);
    const parsedColors = safeJsonParse(colors, []);
    const parsedTags = safeJsonParse(tags, []);
    const parsedColorPrices = safeJsonParse(color_prices, {});
    const parsedVariants = safeJsonParse(variants, []);

    const isActive = is_active !== "false" && is_active !== false;

    // 5. Create product record in database
    const product = await ProductModel.create({
      seller_id: seller.id,
      title,
      slug: finalSlug,
      description: description || null,
      category: category.toLowerCase(),
      price: numPrice,
      compare_at_price: numCompareAtPrice,
      stock: parseInt(stock, 10) || 0,
      sku: sku || null,
      sizes: parsedSizes,
      colors: parsedColors,
      tags: parsedTags,
      color_prices: parsedColorPrices,
      variants: parsedVariants,
      cover_image_url,
      images,
      is_active: isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully with images uploaded.",
      product,
    });
  } catch (err) {
    console.error("[createProduct] error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
}

/**
 * GET /api/products/seller/me
 * Get all products for the logged-in seller
 */
export async function getMyProducts(req, res) {
  try {
    const userId = req.user.id;
    const seller = await getOrEnsureSeller(userId);

    const products = await ProductModel.findBySellerId(seller.id);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    console.error("[getMyProducts] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/products/seller/item/:id
 * Get single product by ID for seller edit
 */
export async function getSellerProductById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const seller = await getOrEnsureSeller(userId);

    const product = await ProductModel.findById(id);
    if (!product || product.seller_id !== seller.id) {
      return res.status(404).json({ success: false, message: "Product not found or access denied." });
    }

    return res.status(200).json({ success: true, product });
  } catch (err) {
    console.error("[getSellerProductById] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * PUT /api/products/:id
 * Update product details / images
 */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const seller = await getOrEnsureSeller(userId);

    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct || existingProduct.seller_id !== seller.id) {
      return res.status(404).json({ success: false, message: "Product not found or access denied." });
    }

    const updates = {};
    const { title, description, category, price, compare_at_price, stock, sku, sizes, colors, tags, color_prices, variants, is_active } = req.body;

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category.toLowerCase();
    if (price !== undefined) updates.price = parseFloat(price);

    const hasCompareAtPrice = compare_at_price !== undefined && compare_at_price !== null && String(compare_at_price).trim() !== "";
    if (compare_at_price !== undefined) {
      updates.compare_at_price = hasCompareAtPrice ? parseFloat(compare_at_price) : null;
    }
    if (stock !== undefined) updates.stock = parseInt(stock, 10) || 0;
    if (sku !== undefined) updates.sku = sku;
    if (is_active !== undefined) updates.is_active = is_active !== "false" && is_active !== false;

    const finalPrice = updates.price !== undefined ? updates.price : existingProduct.price;
    const finalCompareAt = updates.compare_at_price !== undefined ? updates.compare_at_price : existingProduct.compare_at_price;

    if (finalCompareAt !== null && finalCompareAt !== undefined && !isNaN(finalCompareAt) && finalCompareAt < finalPrice) {
      return res.status(400).json({
        success: false,
        message: "Compare at price (MRP / Original Price) must be greater than or equal to the selling price.",
      });
    }

    if (sizes !== undefined) updates.sizes = safeJsonParse(sizes, []);
    if (colors !== undefined) updates.colors = safeJsonParse(colors, []);
    if (tags !== undefined) updates.tags = safeJsonParse(tags, []);
    if (color_prices !== undefined) updates.color_prices = safeJsonParse(color_prices, {});
    if (variants !== undefined) updates.variants = safeJsonParse(variants, []);

    // Optional new image uploads
    const files = req.files || {};
    if (files.coverImage?.[0]) {
      updates.cover_image_url = await uploadImageToStorage(
        files.coverImage[0].buffer,
        files.coverImage[0].originalname,
        files.coverImage[0].mimetype,
        `seller_${seller.id}`
      );
    }
    if (files.galleryImages?.length > 0) {
      const newImages = await uploadMultipleImages(files.galleryImages, `seller_${seller.id}`);
      updates.images = [...(existingProduct.images || []), ...newImages];
    }

    const updatedProduct = await ProductModel.update(id, seller.id, updates);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("[updateProduct] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * DELETE /api/products/:id
 * Soft-delete product
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(403).json({ success: false, message: "Seller profile not found." });
    }

    await ProductModel.delete(id, seller.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteProduct] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/products
 * Public browse & catalog search
 */
export async function getPublicCatalog(req, res) {
  try {
    const { category, subcategory, gender, tag, minPrice, maxPrice, sort, search, page = 1, limit = 40 } = req.query;

    const catalog = await ProductModel.listPublic({
      category,
      subcategory,
      gender,
      tag,
      minPrice,
      maxPrice,
      sort,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.status(200).json({
      success: true,
      ...catalog,
    });
  } catch (err) {
    console.error("[getPublicCatalog] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/products/:slug
 * Public product details page
 */
export async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;
    const product = await ProductModel.findBySlug(slug);

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("[getProductBySlug] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
