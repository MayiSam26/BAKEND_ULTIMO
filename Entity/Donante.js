
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
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
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tbldonantes', 
  
});

module.exports = tbldonantes;