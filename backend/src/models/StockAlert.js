const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAlert = sequelize.define('StockAlert', {
  productId: { type: DataTypes.STRING, allowNull: false },
  color:     { type: DataTypes.STRING, defaultValue: null, allowNull: true },
  size:      { type: DataTypes.STRING, allowNull: false },
  phone:     { type: DataTypes.STRING, allowNull: false },
  notified:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'stock_alerts' });

module.exports = StockAlert;
