// Donacion.js

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblUser = conexion.define('tbluser', {
  iduser: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  pregunta_secreta: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  respuesta_secreta: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  foto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  correo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  nombres: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  apellidos: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fecha_registro: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  },
  rol: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'Administrador',
  },
  activo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  tableName: 'tbluser', // Nombre de la tabla en la base de datos
  
});

module.exports = tblUser;
