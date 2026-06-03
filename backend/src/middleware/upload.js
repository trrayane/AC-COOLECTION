const multer = require('multer');

// Keep files in memory so the storage service can push them to
// Cloudinary or write them to disk, without a temp file.
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (PNG, JPG, WEBP, SVG, GIF)'));
  },
});

module.exports = upload;
