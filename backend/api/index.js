// Vercel serverless entry — serves the Express app as a function.
// All requests are routed here via vercel.json rewrites.
const app = require('../src/app');
const { sequelize } = require('../src/models');

// Migration runs once per cold start; every request awaits it before being served.
const migration = (async () => {
  try {
    await sequelize.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable BOOLEAN NOT NULL DEFAULT true`
    );
  } catch (e) {
    // Table may not exist yet on first boot — non-fatal.
    console.error('[startup-migration] customizable:', e.message);
  }
})();

module.exports = async (req, res) => {
  await migration;
  return app(req, res);
};
