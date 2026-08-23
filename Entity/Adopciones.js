
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tbladopcion = conexion.define('tbladopcion', {
  idadopcion: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idadoptante: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Fecha_Adopcion: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  Observaciones: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Estado: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  MotivoRechazo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tbladopcion', 
  
});

module.exports = tbladopcion;