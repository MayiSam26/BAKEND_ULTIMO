const { Sequelize } = require("sequelize");

// Huella de auditoría compartida por todos los módulos. La escribe siempre el
// servidor (su reloj y el iduser del token), nunca el formulario: si el
// cliente manda estos campos, se descartan.

const COLUMNAS_AUDITORIA = {
  creado_en: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  creado_por: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  modificado_en: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  modificado_por: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
};

const CAMPOS_AUDITORIA = Object.keys(COLUMNAS_AUDITORIA);

/** Campos a agregar al crear un registro. */
function sellarCreacion(req) {
  return {
    creado_en: new Date(),
    creado_por: req && req.user ? req.user.iduser : null,
  };
}

/**
 * Devuelve una copia de los cambios sin la huella de creación (que no se
 * puede reescribir) y con la de modificación puesta por el servidor.
 */
function sellarModificacion(req, cambios) {
  const limpio = { ...(cambios || {}) };
  CAMPOS_AUDITORIA.forEach((c) => delete limpio[c]);
  limpio.modificado_en = new Date();
  limpio.modificado_por = req && req.user ? req.user.iduser : null;
  return limpio;
}

module.exports = { COLUMNAS_AUDITORIA, CAMPOS_AUDITORIA, sellarCreacion, sellarModificacion };
