// Donacion.js

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tbltipoanimal = conexion.define('tbltipoanimal', {
  idtipoanimal: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'tbltipoanimal', // Nombre de la tabla en la base de datos
  
});

module.exports = tbltipoanimal;
