const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

const tblpermiso = conexion.define('tblpermiso', {
  idpermiso: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rol: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  seccion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  visible: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'tblpermiso',
});

module.exports = tblpermiso;
