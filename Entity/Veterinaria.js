const { Sequelize } = require('sequelize');
const conexion = require("../database/conection");
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");

const tblveterinaria = conexion.define('tblveterinaria', {
  idveterinaria: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  tipo: {
    // Diagnóstico | Vacuna | Tratamiento | Esterilización | Control médico
    type: Sequelize.STRING,
    allowNull: false,
  },
  descripcion: {
    type: Sequelize.STRING(500),
    allowNull: false,
  },
  fecha: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  proxima_fecha: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  observaciones: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  // "Pendiente" | "Realizado" — solo tiene sentido cuando hay proxima_fecha
  // (el control programado ya se atendió o sigue pendiente).
  Estado: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "Pendiente",
  },
  fecharegistro: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblveterinaria',
});

module.exports = tblveterinaria;
