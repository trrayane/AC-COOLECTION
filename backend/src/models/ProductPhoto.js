const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A real photo uploaded for a product (admin). A product can have many.
const ProductPhoto = sequelize.define('ProductPhoto', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.STRING, allowNull: false },
  url:       { type: DataTypes.STRING, allowNull: false },
  publicId:  { type: DataTypes.STRING, allowNull: true }, // Cloudinary id (for deletion)
  position:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'product_photos',
});

module.exports = ProductPhoto;
