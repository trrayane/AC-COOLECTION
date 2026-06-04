const router = require('express').Router();
const { StockAlert } = require('../models');
const { requireAdmin } = require('../middleware/auth');

// POST /api/stock-alerts  (public: customer registers interest)
router.post('/', async (req, res, next) => {
  try {
    const { productId, color, size, phone } = req.body || {};
    if (!productId || !size || !phone) return res.status(400).json({ error: 'productId, size and phone are required' });
    // Avoid duplicates for the same phone+product+size
    const exists = await StockAlert.findOne({ where: { productId, color: color || null, size, phone, notified: false } });
    if (exists) return res.json({ ok: true }); // already registered
    await StockAlert.create({ productId, color: color || null, size, phone });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/stock-alerts  (admin: see pending alerts)
router.get('/', requireAdmin, async (req, res, next) => {
  try { res.json(await StockAlert.findAll({ where: { notified: false }, order: [['createdAt', 'DESC']] })); } catch (e) { next(e); }
});

// PATCH /api/stock-alerts/:id/done  (admin: mark as notified/called)
router.patch('/:id/done', requireAdmin, async (req, res, next) => {
  try {
    const alert = await StockAlert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Not found' });
    await alert.update({ notified: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
