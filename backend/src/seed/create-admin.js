/* ===========================================================
   Create (or reset) the admin account — WITHOUT wiping data.
   Username/password come from .env (ADMIN_USERNAME / ADMIN_PASSWORD),
   defaulting to  admin / admin123.

   Run with:  npm run create-admin
   (Works on the local DB, or on the cloud DB if DATABASE_URL is set.)
   =========================================================== */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, AdminUser } = require('../models');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Ensure the admin_users table exists. This is non-destructive
    // (it never drops existing tables/data).
    await sequelize.sync();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await AdminUser.findOne({ where: { username } });
    if (existing) {
      await existing.update({ passwordHash });
      console.log(`🔁 Admin "${username}" already existed — password has been reset.`);
    } else {
      await AdminUser.create({ username, passwordHash });
      console.log(`✅ Admin "${username}" created.`);
    }
    console.log(`   Login → username: ${username}   password: ${password}`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

run();
