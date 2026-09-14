const tblUser = require("../Entity/User");
const { huellaPassword } = require("./sesion");

// El token de acceso dura 4 h y antes nadie volvía a mirar la base: un usuario
// desactivado, con el rol cambiado o con la contraseña cambiada seguía
// entrando hasta que vencía. verifyToken consulta aquí el estado actual del
// usuario. Para no ir a la base en cada petición se recuerda 1 minuto, y
// UserController lo olvida en cuanto el Administrador cambia algo, así que el
// efecto es inmediato.

const DURACION_MS = 60 * 1000;
const recordados = new Map();

/** { existe, activo, rol, huella } del usuario; la huella es la de su contraseña actual. */
async function estadoUsuario(iduser, { ahora = Date.now() } = {}) {
  const clave = Number(iduser);
  const guardado = recordados.get(clave);
  if (guardado && ahora - guardado.t < DURACION_MS) return guardado.estado;

  const user = await tblUser.findOne({ where: { iduser: clave }, attributes: ["iduser", "activo", "rol", "password"] });
  const estado = user
    ? { existe: true, activo: user.activo !== false, rol: user.rol, huella: huellaPassword(user.password) }
    : { existe: false };
  recordados.set(clave, { t: ahora, estado });
  return estado;
}

/** Tras desactivar, cambiar rol o contraseña: la siguiente petición lee la base. */
function olvidarUsuario(iduser) {
  recordados.delete(Number(iduser));
}

/** Motivo para rechazar el token frente al estado actual, o null si vale. */
function motivoRechazo(decoded, estado) {
  if (!estado.existe || !estado.activo) return "Esta cuenta está desactivada. Contacta al administrador del sistema.";
  // Los tokens emitidos antes de este cambio no traen huella: se aceptan hasta que venzan.
  if (decoded.v && decoded.v !== estado.huella) return "La contraseña cambió. Vuelve a iniciar sesión.";
  if (decoded.rol && estado.rol && decoded.rol !== estado.rol) return "Tu rol cambió. Vuelve a iniciar sesión.";
  return null;
}

module.exports = { estadoUsuario, olvidarUsuario, motivoRechazo, DURACION_MS };
