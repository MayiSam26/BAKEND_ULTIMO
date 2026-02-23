
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
 // Importa tu instancia de Sequelize Fecha_Apadrinado

const tblapadrinado = conexion.define('tblapadrinado', {
 idapadrinado: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  iddonantes: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idplanmensual: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  Fecha_Apadrinado: {
    type: Sequelize.DATE,
    allowNull: false,
  }
  
}, {
  tableName: 'tblapadrinado', 
  
});

module.exports = tblapadrinado;