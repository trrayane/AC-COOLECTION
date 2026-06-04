const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromoCode = sequelize.define('PromoCode', {
  code:       { type: DataTypes.STRING, allowNull: false, unique: true },
  type:       { type: DataTypes.STRING, defaultValue: 'percent' }, // 'percent' | 'fixed'
  value:      { type: DataTypes.INTEGER, allowNull: false },        // 10 = 10% or 500 DA
  active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  usageLimit: { type: DataTypes.INTEGER, defaultValue: null, allowNull: true }, // null = unlimited
  usedCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
  expiresAt:  { type: DataTypes.DATEONLY, defaultValue: null, allowNull: true },
}, {
  tableName: 'promo_codes',
});

module.exports = PromoCode;
