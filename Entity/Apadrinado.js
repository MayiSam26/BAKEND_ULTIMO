const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");

const tblapadrinado = conexion.define('tblapadrinado', {
  idapadrinado: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  padrino_nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  padrino_contacto: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  tipo_apadrinamiento: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  monto: {
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  fecha_registro: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  estado: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'Activo',
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblapadrinado',
});

module.exports = tblapadrinado;
