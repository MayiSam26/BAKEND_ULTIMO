const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

const tblmascotaperdida = conexion.define('tblmascotaperdida', {
  idmascotaperdida: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  iddueno: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  foto: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Edad: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idtipoanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idgenero: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  tamano: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Observaciones: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  Fecha_Extravio: {
    type: Sequelize.DATE,
    allowNull: false,
  }
}, {
  tableName: 'tblmascotaperdida', 
  
});

module.exports = tblmascotaperdida;