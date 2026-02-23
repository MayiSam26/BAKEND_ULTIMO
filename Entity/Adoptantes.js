
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tbladoptante = conexion.define('tbladoptante', {
  idadoptante: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  Nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Apellido: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Dni: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Direccion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Motivo: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  Fecha_Registro: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  }
}, {
  tableName: 'tbladoptante', 
  
});

module.exports = tbladoptante;