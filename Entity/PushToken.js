const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

// Teléfonos donde un usuario abrió la app móvil y aceptó recibir
// notificaciones. Un usuario puede tener varios; al cerrar sesión se borra.
const tblpushtoken = conexion.define('tblpushtoken', {
  idpushtoken: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  token: {
    type: Sequelize.STRING(200),
    allowNull: false,
    unique: true,
  },
  plataforma: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  actualizado: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'tblpushtoken',
});

module.exports = tblpushtoken;
