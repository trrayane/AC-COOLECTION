const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { AdminUser } = require('../models');
const { signToken, requireAdmin } = require('../middleware/auth');

// ── Simple in-memory brute-force protection ─────────────────
// After MAX_FAILS failed attempts from the same client, lock for LOCK_MS.
// (For multi-server / behind-proxy setups, set app.set('trust proxy', 1)
//  and/or move this to Redis. Good enough for a single-store deployment.)
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes
const attempts = new Map(); // key -> { fails, lockedUntil }
const keyFor = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown';
const isLocked = (req) => { const a = attempts.get(keyFor(req)); return !!(a && a.lockedUntil && Date.now() < a.lockedUntil); };
const recordFail = (req) => {
  const k = keyFor(req);
  const a = attempts.get(k) || { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) { a.lockedUntil = Date.now() + LOCK_MS; a.fails = 0; }
  attempts.set(k, a);
};
const resetAttempts = (req) => attempts.delete(keyFor(req));

// POST /api/auth/login  { username, password } -> { token, user }
router.post('/login', async (req, res, next) => {
  try {
    if (isLocked(req)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
    }
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const admin = await AdminUser.findOne({ where: { username } });
    if (!admin) { recordFail(req); return res.status(401).json({ error: 'Invalid credentials' }); }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) { recordFail(req); return res.status(401).json({ error: 'Invalid credentials' }); }

    resetAttempts(req);
    res.json({ token: signToken(admin), user: { id: admin.id, username: admin.username } });
  } catch (e) { next(e); }
});

// GET /api/auth/me -> confirms the token is still valid
router.get('/me', requireAdmin, (req, res) => {
  res.json({ user: { id: req.admin.id, username: req.admin.username } });
});

module.exports = router;
