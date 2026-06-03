const { Sequelize } = require('sequelize');
require('dotenv').config();

// One Sequelize instance for the whole app (like Django's DB connection).
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ac_collection',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // set to console.log to see the SQL Sequelize runs
  }
);

module.exports = sequelize;
