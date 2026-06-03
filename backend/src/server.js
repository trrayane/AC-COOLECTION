require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

// Serve locally-stored uploads (used when Cloudinary is not configured)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'AC Collection API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/upload', require('./routes/upload'));

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.startsWith('Only image')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 10 MB)' });
  }
  res.status(500).json({ error: 'Server error' });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    // Create tables if they don't exist yet (non-destructive).
    await sequelize.sync();
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('❌ Could not start server:', e.message);
    console.error('   Is PostgreSQL running and is the database created? See SETUP.md');
    process.exit(1);
  }
})();
