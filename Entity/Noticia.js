const { Sequelize } = require('sequelize');
const conexion = require("../database/conection");
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");

const tblnoticia = conexion.define('tblnoticia', {
  idnoticia: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  titulo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  resumen: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  contenido: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  imagen: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Estado: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'Borrador',
  },
  fecha_publicacion: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblnoticia',
});

module.exports = tblnoticia;
