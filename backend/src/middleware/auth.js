const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Sign a token for a logged-in admin.
function signToken(admin) {
  return jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Express middleware: blocks the request unless a valid admin token is sent
// as "Authorization: Bearer <token>".
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { signToken, requireAdmin, JWT_SECRET };
