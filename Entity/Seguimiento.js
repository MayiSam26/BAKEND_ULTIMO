const { Sequelize } = require('sequelize');
const conexion = require("../database/conection");

const tblseguimiento = conexion.define('tblseguimiento', {
  idseguimiento: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idadopcion: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Fecha_Programada: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  Fecha_Realizado: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  Estado: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
  },
  Observaciones: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  Recomendaciones: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  Evidencia: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'tblseguimiento',
});

module.exports = tblseguimiento;
