// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
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
}, {
  tableName: 'tblingreso', 
  
});

module.exports = tblingreso;