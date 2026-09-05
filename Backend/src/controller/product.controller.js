import ProductModel from "../model/product.model.js";
import SellerModel from "../model/seller.model.js";
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
 * POST /api/products
 * Create a new product with image uploads to Supabase Storage
 */
export async function createProduct(req, res) {
  try {
    const userId = req.user.id;

    // 1. Verify that user has an active seller profile
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "You must complete your seller profile before creating products.",
      });
    }

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
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and price are required.",
      });
    }

    const numPrice = parseFloat(price);
    const numCompareAtPrice = compare_at_price ? parseFloat(compare_at_price) : null;

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
    const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes || "[]") : (sizes || []);
    const parsedColors = typeof colors === "string" ? JSON.parse(colors || "[]") : (colors || []);
    const parsedTags = typeof tags === "string" ? JSON.parse(tags || "[]") : (tags || []);
    const parsedColorPrices = typeof color_prices === "string" ? JSON.parse(color_prices || "{}") : (color_prices || {});
    const parsedVariants = typeof variants === "string" ? JSON.parse(variants || "[]") : (variants || []);

    // 5. Create product record in database
    const product = await ProductModel.create({
      seller_id: seller.id,
      title,
      slug: finalSlug,
      description: description || null,
      category: category.toLowerCase(),
      price: parseFloat(price),
      compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
      stock: parseInt(stock, 10) || 0,
      sku: sku || null,
      sizes: parsedSizes,
      colors: parsedColors,
      tags: parsedTags,
      color_prices: parsedColorPrices,
      variants: parsedVariants,
      cover_image_url,
      images,
      is_active: true,
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
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(403).json({ success: false, message: "Seller profile not found." });
    }

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
    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(403).json({ success: false, message: "Seller profile not found." });
    }

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

    const seller = await SellerModel.findByUserId(userId);
    if (!seller) {
      return res.status(403).json({ success: false, message: "Seller profile not found." });
    }

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
    if (compare_at_price !== undefined) updates.compare_at_price = compare_at_price ? parseFloat(compare_at_price) : null;
    if (stock !== undefined) updates.stock = parseInt(stock, 10);
    if (sku !== undefined) updates.sku = sku;
    if (is_active !== undefined) updates.is_active = is_active;

    const finalPrice = updates.price !== undefined ? updates.price : existingProduct.price;
    const finalCompareAt = updates.compare_at_price !== undefined ? updates.compare_at_price : existingProduct.compare_at_price;

    if (finalCompareAt !== null && finalCompareAt !== undefined && finalCompareAt < finalPrice) {
      return res.status(400).json({
        success: false,
        message: "Compare at price (MRP / Original Price) must be greater than or equal to the selling price.",
      });
    }

    if (sizes !== undefined) updates.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    if (colors !== undefined) updates.colors = typeof colors === "string" ? JSON.parse(colors) : colors;
    if (tags !== undefined) updates.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    if (color_prices !== undefined) updates.color_prices = typeof color_prices === "string" ? JSON.parse(color_prices) : color_prices;
    if (variants !== undefined) updates.variants = typeof variants === "string" ? JSON.parse(variants) : variants;

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
    const { category, tag, sort, search, page = 1, limit = 20 } = req.query;

    const catalog = await ProductModel.listPublic({
      category,
      tag,
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
