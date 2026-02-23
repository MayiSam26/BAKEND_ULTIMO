// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblgenero = conexion.define('tblgenero', {
    idgenero: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  }
}, {
  tableName: 'tblgenero', 
  
});

module.exports = tblgenero;
