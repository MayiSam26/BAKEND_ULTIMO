// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
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
  // Auditoría: los pone el servidor al guardar, nunca el formulario. Sirven
  // para saber cuándo se registró de verdad (la fecha del formulario se puede
  // cambiar) y quién lo hizo.
  creado_en: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  creado_por: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  // Los egresos sí se pueden editar, así que se guarda también la última
  // modificación.
  modificado_en: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  modificado_por: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'tblregistroegreso', 
  
});

module.exports = tblregistroegreso;