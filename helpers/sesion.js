const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Sesión de la app móvil. El token de acceso sigue durando 4 h, igual que en
// el panel web; lo que cambia es que la app recibe además un token de
// renovación de 30 días con el que pide un token de acceso nuevo sin volver a
// escribir la contraseña. Sin él, el móvil echaría al usuario varias veces al
// día.
//
// El de renovación no guarda nada en la base: lleva una huella de la
// contraseña actual. Cambiar la contraseña (o que el administrador la cambie)
// invalida todos los tokens de renovación emitidos antes, y desactivar la
// cuenta también, porque se comprueba contra la fila del usuario al renovar.

const DURACION_ACCESO = "4h";
const DURACION_RENOVACION = "30d";

/** Huella corta del hash de la contraseña: cambia si cambia la contraseña. */
function huellaPassword(passwordHash) {
  return crypto.createHash("sha256").update(String(passwordHash || "")).digest("hex").slice(0, 16);
}

function tokenAcceso(user) {
  return jwt.sign(
    { usuario: user.usuario, iduser: user.iduser, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: DURACION_ACCESO }
  );
}

function tokenRenovacion(user) {
  return jwt.sign(
    { iduser: user.iduser, purpose: "refresh", v: huellaPassword(user.password) },
    process.env.JWT_SECRET,
    { expiresIn: DURACION_RENOVACION }
  );
}

/**
 * Comprueba un token de renovación contra el usuario que devuelve
 * `buscarUsuario(iduser)`. Devuelve { user } si vale o { error } con el
 * mensaje para el cliente.
 */
async function validarRenovacion(refreshToken, buscarUsuario) {
  if (!refreshToken) return { error: "Token de renovación no proporcionado" };

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    return { error: "La sesión expiró. Vuelve a iniciar sesión." };
  }
  if (decoded.purpose !== "refresh") {
    return { error: "Token no válido para esta operación" };
  }

  const user = await buscarUsuario(decoded.iduser);
  if (!user) return { error: "La sesión expiró. Vuelve a iniciar sesión." };
  if (user.activo === false) {
    return { error: "Esta cuenta está desactivada. Contacta al administrador del sistema." };
  }
  if (decoded.v !== huellaPassword(user.password)) {
    return { error: "La contraseña cambió. Vuelve a iniciar sesión." };
  }
  return { user };
}

module.exports = { tokenAcceso, tokenRenovacion, validarRenovacion, huellaPassword };
