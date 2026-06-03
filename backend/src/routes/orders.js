const router = require('express').Router();
const { Order, OrderItem, Product, ProductPhoto } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { deliveryFee, ORDER_STATUSES } = require('../constants');

const itemInclude = {
  model: OrderItem, as: 'items',
  include: [{ model: Product, as: 'product', include: [{ model: ProductPhoto, as: 'photos' }] }],
};

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

    // Re-price everything on the server — never trust client totals.
    let subtotal = 0;
    const lines = [];
    for (const it of b.items) {
      const product = await Product.findByPk(it.productId);
      if (!product) return res.status(400).json({ error: `Unknown product ${it.productId}` });
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
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

    const count = await Order.count();
    const id = 'CMD-' + (7342 + count);
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
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update({ status });
    const full = await Order.findByPk(order.id, { include: [itemInclude] });
    res.json(full);
  } catch (e) { next(e); }
});

module.exports = router;
