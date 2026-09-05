import supabase from "../config/supabaseClient.js";

/**
 * Upload an image buffer to Supabase Storage and return its public URL
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - Image mime type
 * @param {string} folder - Folder path inside bucket (e.g. "seller_uuid")
 * @returns {Promise<string>} Public CDN URL
 */
export async function uploadImageToStorage(buffer, originalName, mimeType, folder = "general") {
  const fileExt = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("products")
    .upload(uniqueName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error("[uploadImageToStorage] error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(uniqueName);

  return publicUrlData.publicUrl;
}

/**
 * Upload multiple files to Supabase Storage
 * @param {Array<Express.Multer.File>} files
 * @param {string} folder
 * @returns {Promise<Array<string>>} Array of public URLs
 */
export async function uploadMultipleImages(files, folder = "general") {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    uploadImageToStorage(file.buffer, file.originalname, file.mimetype, folder)
  );

  return Promise.all(uploadPromises);
}
