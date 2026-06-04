const router = require('express').Router();
const { PromoCode } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// ── Public: validate a promo code at checkout ────────────────
// POST /api/promo/validate  { code }
router.post('/validate', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const promo = await PromoCode.findOne({ where: { code } });
    if (!promo || !promo.active) return res.status(404).json({ error: 'Invalid or expired promo code' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(410).json({ error: 'This promo code has expired' });
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) return res.status(410).json({ error: 'This promo code has reached its usage limit' });
    res.json({ code: promo.code, type: promo.type, value: promo.value });
  } catch (e) { next(e); }
});

// ── Admin CRUD ───────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res, next) => {
  try { res.json(await PromoCode.findAll({ order: [['createdAt', 'DESC']] })); } catch (e) { next(e); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { code, type, value, active, usageLimit, expiresAt } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'code and value are required' });
    const promo = await PromoCode.create({ code: String(code).toUpperCase(), type: type || 'percent', value: parseInt(value, 10), active: active !== false, usageLimit: usageLimit || null, expiresAt: expiresAt || null });
    res.status(201).json(promo);
  } catch (e) { next(e); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Not found' });
    const { type, value, active, usageLimit, expiresAt } = req.body;
    await promo.update({ type: type || promo.type, value: value != null ? parseInt(value, 10) : promo.value, active: active != null ? active : promo.active, usageLimit: usageLimit !== undefined ? (usageLimit || null) : promo.usageLimit, expiresAt: expiresAt !== undefined ? (expiresAt || null) : promo.expiresAt });
    res.json(promo);
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Not found' });
    await promo.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
