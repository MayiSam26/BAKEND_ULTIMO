// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tbldueno = conexion.define('tbldueno', {
    iddueno: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  facebook: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  instagram: {
    type: Sequelize.STRING,
    allowNull: false,
  }
}, {
  tableName: 'tbldueno', 
  
});

module.exports = tbldueno;