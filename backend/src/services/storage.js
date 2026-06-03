/* ===========================================================
   Image storage with automatic fallback.
   - If Cloudinary keys are set in .env  -> upload to Cloudinary.
   - Otherwise                           -> save to local /uploads.
   The rest of the app just calls saveImage()/deleteImage() and
   doesn't care which backend is active.
   =========================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  BASE_URL = 'http://localhost:4000',
} = process.env;

const useCloudinary = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log('🖼️  Image storage: Cloudinary');
} else {
  console.log('🖼️  Image storage: local /uploads folder (set CLOUDINARY_* in .env to switch)');
}

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_FROM_MIME = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg',
  'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/gif': '.gif',
};

/**
 * Save an uploaded file buffer.
 * @param {{buffer:Buffer, mimetype:string, originalname:string}} file (from multer memoryStorage)
 * @param {string} folder logical folder ("products" | "designs")
 * @returns {Promise<{url:string, publicId:string|null}>}
 */
async function saveImage(file, folder = 'uploads') {
  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `ac-collection/${folder}`, resource_type: 'auto' },
        (err, result) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(file.buffer);
    });
  }

  // Local fallback
  const ext = EXT_FROM_MIME[file.mimetype] || path.extname(file.originalname) || '.bin';
  const name = `${folder}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `${BASE_URL}/uploads/${name}`, publicId: null };
}

/**
 * Delete a previously stored image.
 * @param {{url?:string, publicId?:string|null}} ref
 */
async function deleteImage(ref) {
  if (!ref) return;
  try {
    if (useCloudinary && ref.publicId) {
      await cloudinary.uploader.destroy(ref.publicId);
      return;
    }
    if (ref.url && ref.url.includes('/uploads/')) {
      const file = path.join(UPLOAD_DIR, path.basename(ref.url));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  } catch (e) {
    console.warn('deleteImage failed (ignored):', e.message);
  }
}

module.exports = { saveImage, deleteImage, useCloudinary };
