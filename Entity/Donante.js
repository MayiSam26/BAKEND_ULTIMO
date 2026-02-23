
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tbldonantes = conexion.define('tbldonantes', {
 iddonantes: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idtipopersona: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  fullname: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  redsocial: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Ruc: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Dni: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Fecha_Registro: {
    type: Sequelize.DATE,
    allowNull: false,
  }
}, {
  tableName: 'tbldonantes', 
  
});

module.exports = tbldonantes;