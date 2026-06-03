const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A customer order (Cash on Delivery).
const Order = sequelize.define('Order', {
  id:           { type: DataTypes.STRING, primaryKey: true }, // e.g. CMD-7342
  name:         { type: DataTypes.STRING, allowNull: false },
  phone:        { type: DataTypes.STRING, allowNull: false },
  wilaya:       { type: DataTypes.STRING, allowNull: false },
  commune:      { type: DataTypes.STRING, allowNull: false },
  address:      { type: DataTypes.STRING, defaultValue: '' },
  deliveryMode: { type: DataTypes.STRING, defaultValue: 'home' }, // home | desk
  deliveryFee:  { type: DataTypes.INTEGER, defaultValue: 0 },
  subtotal:     { type: DataTypes.INTEGER, defaultValue: 0 },
  total:        { type: DataTypes.INTEGER, defaultValue: 0 },
  status:       { type: DataTypes.STRING, defaultValue: 'pending' },
  note:         { type: DataTypes.TEXT, defaultValue: '' },
  custom:       { type: DataTypes.BOOLEAN, defaultValue: false },
  date:         { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }, // display date (YYYY-MM-DD)
}, {
  tableName: 'orders',
});

module.exports = Order;
