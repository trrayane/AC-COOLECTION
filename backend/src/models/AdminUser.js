const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// The store owner login. Passwords are stored hashed (bcrypt), never plain.
const AdminUser = sequelize.define('AdminUser', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username:     { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'admin_users',
});

module.exports = AdminUser;
