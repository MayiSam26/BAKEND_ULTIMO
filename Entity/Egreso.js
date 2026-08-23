// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tblregistroegreso = conexion.define('tblregistroegreso', {
    idregistroegreso: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Descripcion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Monto: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fechato: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblregistroegreso', 
  
});

module.exports = tblregistroegreso;