const router = require('express').Router();
const upload = require('../middleware/upload');
const { saveImage } = require('../services/storage');

// POST /api/upload/design  (multipart, field "file")
// Public: used by the configurator so a customer's artwork is stored and
// its URL travels with the order to the admin.
router.post('/design', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { url, publicId } = await saveImage(req.file, 'designs');
    res.status(201).json({ url, publicId });
  } catch (e) { next(e); }
});

module.exports = router;
