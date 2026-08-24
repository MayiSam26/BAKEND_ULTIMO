// Donacion.js

const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")
const { COLUMNAS_AUDITORIA } = require("../helpers/auditoria");
 // Importa tu instancia de Sequelize

const tblplanmensual = conexion.define('tblplanmensual', {
  idplanmensual: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  img: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  // Ojo: pese al nombre, esta columna guarda la URL del logo del canal
  // (Yape/Plin/PayPal), no un monto. Se deja como texto porque eso es lo que
  // hay en la base y lo que consume el sitio público (<img src={cantidad}>).
  cantidad: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  // Huella de auditoría (quién creó/modificó y cuándo). Ver helpers/auditoria.
  ...COLUMNAS_AUDITORIA,
}, {
  tableName: 'tblplanmensual', // Nombre de la tabla en la base de datos
  
});

module.exports = tblplanmensual;
