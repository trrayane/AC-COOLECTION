/* ===========================================================
   Local development server (long-running). On Vercel, api/index.js
   is used instead and this file is not run.
   =========================================================== */
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    await sequelize.sync(); // create tables if missing (local convenience)
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('❌ Could not start server:', e.message);
    console.error('   Is PostgreSQL running and is the database created? See SETUP.md');
    process.exit(1);
  }
})();
