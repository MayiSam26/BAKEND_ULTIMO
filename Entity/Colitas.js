
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tblanimal = conexion.define('tblanimal', {
 idanimal: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  idtipoanimal: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  idadopcion:{
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  idgenero: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  tamano: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  peso: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  // Edad estimada al momento de ingresar, en años. Se conserva como registro
  // histórico de lo que se declaró; la edad que se MUESTRA se calcula a partir
  // de fecha_nacimiento (ver helpers/edad).
  Edada_Aprox: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  // Fecha de nacimiento. Si no se conoce la exacta, se guarda la que implica
  // la edad estimada al ingresar y nacimiento_exacto queda en false, para
  // poder mostrar la edad como aproximada.
  fecha_nacimiento: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  nacimiento_exacto: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  foto: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  observaciones: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  estado: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // Por qué el animal quedó en el estado actual. Obligatorio cuando sale del
  // albergue por una vía que no es la adopción ("De baja", "Fallecido"), para
  // que la salida quede explicada y no solo registrada.
  motivo_estado: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  esterelizacion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Fecha_Ingreso: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  fechaRegistro: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblanimal', 
  
});

module.exports = tblanimal;