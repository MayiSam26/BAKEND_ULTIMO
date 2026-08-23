// TipoPersona

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tbldueno = conexion.define('tbldueno', {
    iddueno: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  facebook: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  instagram: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  // Número de WhatsApp del dueño (9 dígitos, Perú). En el sitio público NO se
  // muestra escrito: solo alimenta el botón "Escribir por WhatsApp", para no
  // dejar el número a la vista de cualquiera que entre a la web.
  whatsapp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tbldueno', 
  
});

module.exports = tbldueno;