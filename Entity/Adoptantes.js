
const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tbladoptante = conexion.define('tbladoptante', {
  idadoptante: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  Nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Apellido: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Dni: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Direccion: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  Motivo: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  Fecha_Registro: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  // Contacto. El correo hacia falta de verdad: sin campo propio alguien
  // termino escribiendolo dentro de Direccion. El telefono de referencia es
  // el respaldo para cuando la persona cambia de numero, que es la forma mas
  // comun de perderle el rastro a una adopcion.
  correo: {
    type: Sequelize.STRING(150),
    allowNull: true,
  },
  telefono_referencia: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  distrito: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  // El contrato lo firma un adulto, asi que la fecha sirve para validarlo.
  fecha_nacimiento: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  // Evaluacion de la vivienda. Antes esto solo quedaba como texto libre en
  // las respuestas de la entrevista, donde no se puede filtrar ni contar.
  // La tenencia importa para el seguimiento: quien alquila tiene mas
  // probabilidad de mudarse dentro del primer anio.
  tipo_vivienda: {
    type: Sequelize.STRING(30),
    allowNull: true,
  },
  tenencia_vivienda: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  tiene_patio: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  tiene_otras_mascotas: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  detalle_mascotas: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tbladoptante', 
  
});

module.exports = tbladoptante;