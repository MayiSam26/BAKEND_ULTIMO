// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblregistroegreso = conexion.define('tblregistroegreso', {
    idregistroegreso: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Monto: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fechato: {
    type: Sequelize.DATE,
    allowNull: false,
  }
}, {
  tableName: 'tblregistroegreso', 
  
});

module.exports = tblregistroegreso;