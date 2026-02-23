// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize

const btlauditoria = conexion.define('btlauditoria', {
    idauditoria: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  modulo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fechaInicio: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  fechaRegistro: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  resultado:{
    type: Sequelize.DECIMAL,
    allowNull: true,
  }
}, {
  tableName: 'btlauditoria', 
  
});

module.exports = btlauditoria;
