const { Sequelize } = require('sequelize');
const conexion = require("../database/conection");

const tblentrevista = conexion.define('tblentrevista', {
  identrevista: {
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
  Fecha_Entrevista: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  Hora_Entrevista: {
    type: Sequelize.STRING(10),
    allowNull: true,
  },
  Estado: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
  },
  Respuestas: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  Observaciones: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  Cumple_Requisitos: {
    type: Sequelize.STRING(10),
    allowNull: true,
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'tblentrevista',
});

module.exports = tblentrevista;
