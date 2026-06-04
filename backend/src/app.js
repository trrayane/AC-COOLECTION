/* ===========================================================
   Express app (no listen) — shared by local server + Vercel serverless.
   =========================================================== */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.set('trust proxy', true); // behind Vercel/proxy: req.ip becomes the real client IP (X-Forwarded-For)
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

// Local image fallback (only used when Cloudinary isn't configured / local dev)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'AC Collection API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/upload', require('./routes/upload'));

// Error handler
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

module.exports = app;
