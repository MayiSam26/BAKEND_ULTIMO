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
  // Medicion vieja, en MINUTOS, que cronometraba desde el inicio de sesion
  // hasta el guardado. Se conserva como historico pero ya no se escribe.
  resultado:{
    type: Sequelize.DECIMAL,
    allowNull: true,
  },
  // Medicion actual, en SEGUNDOS: desde que se abre el formulario hasta que
  // se guarda. Columna aparte para no mezclar unidades con la anterior; el
  // reporte solo mira esta.
  segundos: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'btlauditoria', 
  
});

module.exports = btlauditoria;
