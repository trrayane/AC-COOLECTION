const router = require('express').Router();
const crypto = require('crypto');
const { Product, ProductPhoto } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { saveImage, deleteImage } = require('../services/storage');

// Shape a product for the frontend (photos sorted, isNew -> new).
function serialize(p) {
  const o = p.toJSON();
  const photos = (o.photos || []).slice().sort((a, b) => a.position - b.position);
  return {
    id: o.id, cat: o.cat, name_en: o.name_en, name_ar: o.name_ar,
    price: o.price, oldPrice: o.oldPrice, new: o.isNew, rating: o.rating,
    sold: o.sold, colors: o.colors || [], sizes: o.sizes || [],
    desc_en: o.desc_en, desc_ar: o.desc_ar, stock: o.stock || {},
    customizable: o.customizable !== false,
    photos: photos.map((ph) => ({ id: ph.id, url: ph.url })),
  };
}
const withPhotos = { include: [{ model: ProductPhoto, as: 'photos' }] };

// Accept either "new" or "isNew" from the client.
function normalizeBody(b = {}) {
  const out = {
    cat: b.cat, name_en: b.name_en, name_ar: b.name_ar,
    price: b.price != null ? parseInt(b.price, 10) : undefined,
    oldPrice: b.oldPrice ? parseInt(b.oldPrice, 10) : null,
    isNew: b.isNew != null ? !!b.isNew : (b.new != null ? !!b.new : undefined),
    customizable: b.customizable != null ? !!b.customizable : undefined,
    colors: b.colors, sizes: b.sizes,
    desc_en: b.desc_en, desc_ar: b.desc_ar, stock: b.stock,
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

// ── Public ──────────────────────────────────────────────────
// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.findAll({ ...withPhotos, order: [['createdAt', 'DESC']] });
    res.json(products.map(serialize));
  } catch (e) { next(e); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id, withPhotos);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(serialize(p));
  } catch (e) { next(e); }
});

// ── Admin ───────────────────────────────────────────────────
// POST /api/products
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const data = normalizeBody(req.body);
    if (!data.name_en || !data.cat || data.price == null) {
      return res.status(400).json({ error: 'name_en, cat and price are required' });
    }
    const id = 'p' + crypto.randomBytes(5).toString('hex');
    const p = await Product.create({
      id, rating: 4.7, sold: 0, colors: [], sizes: [], stock: {}, ...data,
    });
    const full = await Product.findByPk(p.id, withPhotos);
    res.status(201).json(serialize(full));
  } catch (e) { next(e); }
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    await p.update(normalizeBody(req.body));
    const full = await Product.findByPk(p.id, withPhotos);
    res.json(serialize(full));
  } catch (e) { next(e); }
});

// DELETE /api/products/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id, withPhotos);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    for (const ph of p.photos || []) await deleteImage({ url: ph.url, publicId: ph.publicId });
    await p.destroy(); // cascade removes photo rows
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/products/:id/photos  (multipart, field "photos", up to 8 files)
router.post('/:id/photos', requireAdmin, upload.array('photos', 8), async (req, res, next) => {
  try {
    const p = await Product.findByPk(req.params.id, withPhotos);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });

    let pos = (p.photos || []).length;
    for (const file of req.files) {
      const { url, publicId } = await saveImage(file, 'products');
      await ProductPhoto.create({ productId: p.id, url, publicId, position: pos++ });
    }
    const full = await Product.findByPk(p.id, withPhotos);
    res.status(201).json(serialize(full));
  } catch (e) { next(e); }
});

// DELETE /api/products/:id/photos/:photoId
router.delete('/:id/photos/:photoId', requireAdmin, async (req, res, next) => {
  try {
    const ph = await ProductPhoto.findOne({
      where: { id: req.params.photoId, productId: req.params.id },
    });
    if (!ph) return res.status(404).json({ error: 'Photo not found' });
    await deleteImage({ url: ph.url, publicId: ph.publicId });
    await ph.destroy();
    const full = await Product.findByPk(req.params.id, withPhotos);
    res.json(serialize(full));
  } catch (e) { next(e); }
});

module.exports = router;
