const { Sequelize } = require('sequelize');
const conexion = require("../database/conection")

// Sesiones cerradas desde la app o el panel. Cada inicio de sesión tiene un
// identificador (`sid`) que llevan su token de acceso y su token de
// renovación; al cerrar sesión se anota aquí hasta que esos tokens habrían
// vencido, y el servidor los rechaza. Las filas vencidas se borran solas.
const tblsesionrevocada = conexion.define('tblsesionrevocada', {
  sid: {
    type: Sequelize.STRING(36),
    primaryKey: true,
  },
  iduser: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  expira: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  creado: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'tblsesionrevocada',
});

module.exports = tblsesionrevocada;
