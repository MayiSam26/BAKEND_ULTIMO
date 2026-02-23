// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblrefugio = conexion.define('tblrefugio', {
    idrefugio: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  logo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  correo: {
    type: Sequelize.STRING,
    allowNull: false,
  }
}, {
  tableName: 'tblrefugio', 
  
});

module.exports = tblrefugio;