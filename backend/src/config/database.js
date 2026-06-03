const { Sequelize } = require('sequelize');
const pg = require('pg'); // explicit import so serverless bundlers (Vercel) include it
require('dotenv').config();

// In the cloud (Vercel/Neon/Supabase) a single connection string is provided.
// Locally we use the discrete DB_* variables.
const CONNECTION_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sequelize;
if (CONNECTION_URL) {
  sequelize = new Sequelize(CONNECTION_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 3, min: 0, idle: 10000 }, // small pool: friendly to serverless
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ac_collection',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectModule: pg,
      logging: false,
    }
  );
}

module.exports = sequelize;
