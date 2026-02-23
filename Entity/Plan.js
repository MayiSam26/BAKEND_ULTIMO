// Donacion.js

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblplanmensual = conexion.define('tblplanmensual', {
  idplanmensual: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  img: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  cantidad: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  }
}, {
  tableName: 'tblplanmensual', // Nombre de la tabla en la base de datos
  
});

module.exports = tblplanmensual;
