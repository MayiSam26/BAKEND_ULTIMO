
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tbladopcion = conexion.define('tbladopcion', {
  idadopcion: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idadoptante: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Fecha_Adopcion: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  Observaciones: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Estado: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
  }
}, {
  tableName: 'tbladopcion', 
  
});

module.exports = tbladopcion;