// Donacion.js

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblUser = conexion.define('tbluser', {
  iduser: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  }
}, {
  tableName: 'tbluser', // Nombre de la tabla en la base de datos
  
});

module.exports = tblUser;
