const router = require('express').Router();
const upload = require('../middleware/upload');
const { saveImage } = require('../services/storage');

// ── Anti-abuse rate limit (this endpoint is public) ─────────
// Stops someone from mass-uploading to drain the Cloudinary quota.
const hits = new Map(); // ip -> [timestamps]
const WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX = 30;                // 30 uploads / 10 min / IP
function limited(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX;
}

// POST /api/upload/design  (multipart, field "file")
// Public: used by the configurator so a customer's artwork is stored and
// its URL travels with the order to the admin.
router.post('/design', (req, res, next) => {
  if (limited(req)) return res.status(429).json({ error: 'Too many uploads. Please slow down.' });
  next();
}, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { url, publicId } = await saveImage(req.file, 'designs');
    res.status(201).json({ url, publicId });
  } catch (e) { next(e); }
});

module.exports = router;
