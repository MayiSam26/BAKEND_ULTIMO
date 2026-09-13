const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

// Fallos que la app móvil anota en el teléfono y manda al volver a tener
// señal (ver ErrorAppController). El Administrador los ve desde la app.
const tblerrorapp = conexion.define('tblerrorapp', {
  iderror: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  usuario: {
    type: Sequelize.STRING(60),
    allowNull: true,
  },
  lugar: {
    type: Sequelize.STRING(120),
    allowNull: false,
  },
  mensaje: {
    type: Sequelize.STRING(500),
    allowNull: false,
  },
  pila: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  plataforma: {
    type: Sequelize.STRING(60),
    allowNull: true,
  },
  version: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  fecha: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  recibido: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'tblerrorapp',
});

module.exports = tblerrorapp;
