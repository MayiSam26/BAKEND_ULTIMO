
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const tblanimal = conexion.define('tblanimal', {
 idanimal: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  idtipoanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idadopcion:{
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idgenero: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  tamano: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  peso: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Edada_Aprox: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  foto: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  observaciones: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  estado: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  esterelizacion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Fecha_Ingreso: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  fechaRegistro: {
    type: Sequelize.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tblanimal', 
  
});

module.exports = tblanimal;