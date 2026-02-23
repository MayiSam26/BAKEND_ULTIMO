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
  }
}, {
  tableName: 'tblingreso', 
  
});

module.exports = tblingreso;