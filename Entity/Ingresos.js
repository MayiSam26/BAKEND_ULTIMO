// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tblingreso = conexion.define('tblingreso', {
  idtblingreso: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iddonantes: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  monto: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  suministro: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fecha_registro: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  donacion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  pago: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  evidencia: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblingreso', 
  
});

module.exports = tblingreso;