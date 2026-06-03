/* ===========================================================
   Seed the database: admin user, products (ONE PER COLOUR), demo orders.
   Run with:  npm run seed
   ⚠️  This RESETS the tables (drops and recreates them).
   =========================================================== */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Product, Order, OrderItem, AdminUser } = require('../models');
const { deliveryFee } = require('../constants');
const { PRODUCTS, SEED_ORDERS } = require('./data');

// Colour labels (so each per-colour product gets a readable name)
const CL = {
  en: { cream: 'Cream', sand: 'Sand', clay: 'Terracotta', rust: 'Brick', olive: 'Olive', forest: 'Forest', ink: 'Black', slate: 'Slate', navy: 'Navy', white: 'White', blush: 'Dusty Pink', mustard: 'Mustard' },
  ar: { cream: 'كريمي', sand: 'رملي', clay: 'طيني', rust: 'آجري', olive: 'زيتوني', forest: 'أخضر غامق', ink: 'أسود', slate: 'رمادي', navy: 'كحلي', white: 'أبيض', blush: 'وردي', mustard: 'خردلي' },
};

// Expand each base product into one product per colour.
function expandByColour() {
  const out = [];
  PRODUCTS.forEach((base) => {
    base.colors.forEach((color) => {
      out.push({
        ...base,
        id: `${base.id}-${color}`,
        colors: [color],
        name_en: `${base.name_en} — ${CL.en[color] || color}`,
        name_ar: `${base.name_ar} — ${CL.ar[color] || color}`,
      });
    });
  });
  return out;
}

// Stock map { "color:size": qty } for a single-colour product.
function buildStock(product, idx) {
  const stock = {};
  const color = product.colors[0];
  product.sizes.forEach((size, si) => {
    stock[`${color}:${size}`] = ((idx * 5 + si * 2) % 14) + 1; // 1..14
  });
  return stock;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // Admin
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await AdminUser.create({ username, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`✅ Admin created  (username: ${username} / password: ${password})`);

    // Products — one per colour
    const expanded = expandByColour();
    for (let i = 0; i < expanded.length; i++) {
      await Product.create({ ...expanded[i], stock: buildStock(expanded[i], i) });
    }
    console.log(`✅ ${expanded.length} products created (one per colour, from ${PRODUCTS.length} base styles)`);

    // Orders — seed item pids map to the per-colour product id ("p7" + "ink" -> "p7-ink")
    const priceOf = {};
    expanded.forEach((p) => { priceOf[p.id] = { price: p.price, name: p.name_en }; });

    for (const o of SEED_ORDERS) {
      let subtotal = 0;
      const lines = o.items.map((it) => {
        const pid = `${it.pid}-${it.color}`;
        const ref = priceOf[pid] || { price: 0, name: '' };
        subtotal += ref.price * it.qty;
        return {
          productId: pid, productName: ref.name, unitPrice: ref.price,
          color: it.color, size: it.size, qty: it.qty, custom: !!it.custom,
          customData: it.custom ? { note: it.note || '' } : null,
        };
      });
      const fee = deliveryFee(o.wilaya, 'home');
      const customLine = o.items.find((it) => it.custom);

      const order = await Order.create({
        id: o.id, name: o.name, phone: o.phone, wilaya: o.wilaya, commune: o.commune,
        address: '', deliveryMode: 'home', deliveryFee: fee,
        subtotal, total: subtotal + fee, status: o.status, date: o.date,
        custom: o.items.some((it) => it.custom),
        note: (customLine && customLine.note) || '',
      });
      for (const line of lines) await OrderItem.create({ ...line, orderId: order.id });
    }
    console.log(`✅ ${SEED_ORDERS.length} demo orders created`);

    console.log('\n🎉 Seed complete.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  }
}

run();
