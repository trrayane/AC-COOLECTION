const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One line in an order. We snapshot the product name + unit price so the
// order stays correct even if the product is later edited or deleted.
const OrderItem = sequelize.define('OrderItem', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId:     { type: DataTypes.STRING, allowNull: false },
  productId:   { type: DataTypes.STRING, allowNull: true },
  productName: { type: DataTypes.STRING, defaultValue: '' },
  unitPrice:   { type: DataTypes.INTEGER, defaultValue: 0 },
  color:       { type: DataTypes.STRING, allowNull: true },
  size:        { type: DataTypes.STRING, allowNull: true },
  qty:         { type: DataTypes.INTEGER, defaultValue: 1 },
  custom:      { type: DataTypes.BOOLEAN, defaultValue: false },
  // { zone, view, transform:{x,y,scale,rotate}, note, designUrl, fee }
  customData:  { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'order_items',
});

module.exports = OrderItem;
