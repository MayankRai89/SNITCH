import multer from "multer";

// Use memory storage so we can stream/upload directly to Supabase Storage
const storage = multer.memoryStorage();

// Accept common web image formats
function fileFilter(_req, file, cb) {
  const isImageMime =
    file.mimetype.startsWith("image/") ||
    [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/jfif",
      "image/pjpeg",
      "image/x-png",
      "image/svg+xml",
    ].includes(file.mimetype);

  const isImageExt = /\.(jpe?g|png|webp|avif|gif|jfif|svg|bmp)$/i.test(
    file.originalname || ""
  );

  if (isImageMime || isImageExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Please upload a valid image file (JPEG, PNG, WebP, AVIF, GIF)."
      ),
      false
    );
  }
}

export const uploadProductMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB per file
    files: 10,                  // Up to 1 cover + 9 gallery images
  },
});

const productUploadFields = uploadProductMedia.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 9 },
]);

export function handleProductUpload(req, res, next) {
  productUploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image size exceeds maximum limit of 15MB.",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process uploaded images.",
      });
    }
    next();
  });
}

