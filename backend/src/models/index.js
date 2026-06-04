const sequelize = require('../config/database');
const Product = require('./Product');
const ProductPhoto = require('./ProductPhoto');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const AdminUser = require('./AdminUser');
const PromoCode = require('./PromoCode');

// ── Associations ────────────────────────────────────────────
// A product has many photos; deleting the product deletes its photos.
Product.hasMany(ProductPhoto, { as: 'photos', foreignKey: 'productId', onDelete: 'CASCADE' });
ProductPhoto.belongsTo(Product, { foreignKey: 'productId' });

// An order has many line items; deleting the order deletes its items.
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// A line item points back to a product (kept nullable: product may be deleted).
OrderItem.belongsTo(Product, { as: 'product', foreignKey: 'productId', constraints: false });

module.exports = {
  sequelize,
  Product,
  ProductPhoto,
  Order,
  OrderItem,
  AdminUser,
  PromoCode,
};
