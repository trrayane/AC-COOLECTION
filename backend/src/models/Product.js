const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A garment available in the shop. Stock is kept as a JSON map
// keyed "color:size" -> quantity (e.g. { "ink:M": 12 }).
const Product = sequelize.define('Product', {
  id:        { type: DataTypes.STRING, primaryKey: true },
  cat:       { type: DataTypes.STRING, allowNull: false }, // tshirt | pull | hoodie
  name_en:   { type: DataTypes.STRING, allowNull: false },
  name_ar:   { type: DataTypes.STRING, allowNull: false },
  price:     { type: DataTypes.INTEGER, allowNull: false }, // DZD
  oldPrice:  { type: DataTypes.INTEGER, allowNull: true },
  isNew:     { type: DataTypes.BOOLEAN, defaultValue: false },
  customizable: { type: DataTypes.BOOLEAN, defaultValue: true }, // shows in the customizer + "Customize" button
  rating:    { type: DataTypes.FLOAT, defaultValue: 4.7 },
  sold:      { type: DataTypes.INTEGER, defaultValue: 0 },
  colors:    { type: DataTypes.JSONB, defaultValue: [] }, // ['ink','clay',...]
  sizes:     { type: DataTypes.JSONB, defaultValue: [] }, // ['S','M',...]
  desc_en:   { type: DataTypes.TEXT, defaultValue: '' },
  desc_ar:   { type: DataTypes.TEXT, defaultValue: '' },
  stock:     { type: DataTypes.JSONB, defaultValue: {} }, // { "color:size": qty }
}, {
  tableName: 'products',
});

module.exports = Product;
