const router = require('express').Router();
const { Op } = require('sequelize');
const { Order, OrderItem, Product, ProductPhoto } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { deliveryFee, ORDER_STATUSES } = require('../constants');
const { notifyNewOrder } = require('../services/notify');

// Snapshots only (productName/price/color/size live on the item). The frontend
// resolves product details/photos from its in-memory catalog, so we skip the
// heavy product+photos join → smaller, faster responses.
const itemInclude = { model: OrderItem, as: 'items' };

// ── Anti-spam (layer 1: per-IP burst, in-memory) ────────────
const orderHits = new Map(); // ip -> [timestamps]
const IP_WINDOW = 60 * 1000;     // 1 minute
const IP_MAX = 5;                // max 5 order attempts / minute / IP
function ipTooFast(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const recent = (orderHits.get(ip) || []).filter((t) => now - t < IP_WINDOW);
  recent.push(now);
  orderHits.set(ip, recent);
  if (orderHits.size > 5000) orderHits.clear(); // guard against unbounded growth
  return recent.length > IP_MAX;
}

// ── Public: place an order (Cash on Delivery) ───────────────
// Body: { name, phone, wilaya, commune, address, deliveryMode, note,
//         items: [{ productId, color, size, qty, custom, customData }] }
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.phone || !b.wilaya || !b.commune) {
      return res.status(400).json({ error: 'name, phone, wilaya and commune are required' });
    }
    if (!Array.isArray(b.items) || b.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Anti-spam layer 1: per-IP burst
    if (ipTooFast(req)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    // Anti-spam layer 2: same phone flooding (DB-backed, persists across serverless instances)
    const recentSamePhone = await Order.count({
      where: { phone: b.phone, createdAt: { [Op.gt]: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    if (recentSamePhone >= 4) {
      return res.status(429).json({ error: 'Too many orders from this number recently. Please try again later.' });
    }

    // Re-price everything on the server — never trust client totals.
    let subtotal = 0;
    const lines = [];
    for (const it of b.items) {
      const product = await Product.findByPk(it.productId);
      if (!product) return res.status(400).json({ error: `Unknown product ${it.productId}` });
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      // Stock check (only when this variant's stock is tracked)
      const avail = product.stock && product.stock[`${it.color}:${it.size}`];
      if (typeof avail === 'number' && avail < qty) {
        return res.status(409).json({ error: `Not enough stock for ${product.name_en} (${[it.color, it.size].filter(Boolean).join(' ')})` });
      }
      const customFee = it.custom && it.customData && it.customData.fee ? parseInt(it.customData.fee, 10) || 0 : 0;
      const unitPrice = product.price + customFee;
      subtotal += unitPrice * qty;
      lines.push({
        productId: product.id, productName: product.name_en, unitPrice,
        color: it.color || null, size: it.size || null, qty,
        custom: !!it.custom, customData: it.custom ? (it.customData || null) : null,
      });
    }

    const mode = b.deliveryMode === 'desk' ? 'desk' : 'home';
    const fee = deliveryFee(b.wilaya, mode);
    const total = subtotal + fee;

    // Next id = highest existing number + 1 (robust to deleted orders, unlike a count).
    const all = await Order.findAll({ attributes: ['id'] });
    let maxNum = 7341;
    for (const o of all) { const n = parseInt(String(o.id).replace(/\D/g, ''), 10); if (!Number.isNaN(n) && n > maxNum) maxNum = n; }
    const id = 'CMD-' + (maxNum + 1);
    const customLine = lines.find((l) => l.custom);

    const order = await Order.create({
      id, name: b.name, phone: b.phone, wilaya: b.wilaya, commune: b.commune,
      address: b.address || '', deliveryMode: mode, deliveryFee: fee,
      subtotal, total, status: 'pending', date: new Date(),
      note: (customLine && customLine.customData && customLine.customData.note) || b.note || '',
      custom: lines.some((l) => l.custom),
    });
    for (const line of lines) await OrderItem.create({ ...line, orderId: order.id });

    // Best-effort stock decrement (keeps inventory roughly in sync).
    for (const line of lines) {
      if (!line.color || !line.size) continue;
      const p = await Product.findByPk(line.productId);
      const stock = { ...(p.stock || {}) };
      const key = `${line.color}:${line.size}`;
      if (stock[key] != null) {
        stock[key] = Math.max(0, stock[key] - line.qty);
        await p.update({ stock });
      }
    }

    const full = await Order.findByPk(order.id, { include: [itemInclude] });
    await notifyNewOrder(full); // alert the owner (Telegram/email) if configured — never throws
    res.status(201).json(full);
  } catch (e) { next(e); }
});

// ── Admin ───────────────────────────────────────────────────
// GET /api/orders
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.findAll({ include: [itemInclude], order: [['date', 'DESC'], ['id', 'DESC']] });
    res.json(orders);
  } catch (e) { next(e); }
});

// GET /api/orders/:id
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [itemInclude] });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) { next(e); }
});

// PATCH /api/orders/:id/status  { status }
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findByPk(req.params.id, { include: [itemInclude] });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const prev = order.status;
    await order.update({ status });

    // Auto-restock when cancelling a non-cancelled order (return reserved units to inventory)
    if (status === 'cancelled' && prev !== 'cancelled') {
      for (const item of order.items || []) {
        if (!item.color || !item.size) continue;
        const product = await Product.findByPk(item.productId);
        if (!product) continue;
        const stock = { ...(product.stock || {}) };
        const key = `${item.color}:${item.size}`;
        if (typeof stock[key] === 'number') {
          stock[key] = stock[key] + item.qty;
          await product.update({ stock });
        }
      }
    }

    const full = await Order.findByPk(order.id, { include: [itemInclude] });
    res.json(full);
  } catch (e) { next(e); }
});

// DELETE /api/orders/:id  (admin: delete one order + its items)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await OrderItem.destroy({ where: { orderId: order.id } });
    await order.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/orders?status=cancelled  (admin: bulk-clear every order of a status)
router.delete('/', requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'A valid ?status= is required' });
    }
    const ids = (await Order.findAll({ where: { status }, attributes: ['id'] })).map((o) => o.id);
    if (ids.length) {
      await OrderItem.destroy({ where: { orderId: { [Op.in]: ids } } });
      await Order.destroy({ where: { id: { [Op.in]: ids } } });
    }
    res.json({ ok: true, deleted: ids.length });
  } catch (e) { next(e); }
});

module.exports = router;
