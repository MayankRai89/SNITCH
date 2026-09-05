import multer from "multer";

// Use memory storage so we can stream/upload directly to Supabase Storage
const storage = multer.memoryStorage();

// Accept common web image formats only
function fileFilter(_req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."), false);
  }
}

export const uploadProductMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 10,                  // Up to 1 cover + 9 gallery images
  },
});
