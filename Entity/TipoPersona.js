// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblTipoPersona = conexion.define('tbltipopersona', {
  idtipopersona: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  }
}, {
  tableName: 'tbltipopersona', 
  
});

module.exports = tblTipoPersona;
