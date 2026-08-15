const { Sequelize } = require('sequelize');
const conexion = require("../database/conection");

const tblvoluntariovisita = conexion.define('tblvoluntariovisita', {
  idvisita: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    // A qué voluntario se le asigna la visita.
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  nota: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  // "Pendiente" | "Realizado"
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
}, {
  tableName: 'tblvoluntariovisita',
});

module.exports = tblvoluntariovisita;
