// Vercel serverless entry — serves the Express app as a function.
// All requests are routed here via vercel.json rewrites.
const app = require('../src/app');
const { sequelize } = require('../src/models');

// Run safe column migrations once per cold start (idempotent ADD COLUMN IF NOT EXISTS).
let _migrated = false;
(async () => {
  if (_migrated) return;
  _migrated = true;
  try {
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable BOOLEAN NOT NULL DEFAULT true;
    `);
  } catch (e) {
    // Non-fatal: column may already exist or table not yet created.
    console.error('[migration] customizable column:', e.message);
  }
})();

module.exports = app;
