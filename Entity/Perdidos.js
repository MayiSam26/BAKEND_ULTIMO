const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

// Los tipos y el mapeo de "foto" -> columna real "img" reflejan el esquema
// verificado en la BD de Railway (SHOW COLUMNS), que no coincidía con la
// definición original de este modelo (esa discrepancia era la causa de que
// crear/editar mascotas perdidas fallara en silencio contra la BD real).
const tblmascotaperdida = conexion.define('tblmascotaperdida', {
  idmascotaperdida: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  iddueno: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  Nombre: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  foto: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'img',
  },
  Edad: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  idtipoanimal: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idgenero: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  tamano: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Observaciones: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  Fecha_Extravio: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'P',
  }
}, {
  tableName: 'tblmascotaperdida',

});

module.exports = tblmascotaperdida;
