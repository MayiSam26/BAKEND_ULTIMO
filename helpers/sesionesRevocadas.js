const { Op } = require("sequelize");
const tblsesionrevocada = require("../Entity/SesionRevocada");

// Sesiones cerradas, en memoria: verifyToken las consulta en cada petición sin
// ir a la base. Al arrancar (y cada minuto, por si algún día hay más de una
// réplica) se leen de la tabla; cerrar sesión las añade al momento.

const RECARGA_MS = 60 * 1000;
const revocadas = new Map(); // sid -> expira (ms)

async function recargar(ahora = Date.now()) {
  const filas = await tblsesionrevocada.findAll({ where: { expira: { [Op.gt]: new Date(ahora) } }, attributes: ["sid", "expira"] });
  // Se suman las de la base sin tirar las de memoria: una recién cerrada cuya
  // escritura aún no terminó no debe "reabrirse".
  filas.forEach((f) => revocadas.set(f.sid, new Date(f.expira).getTime()));
  for (const [sid, expira] of revocadas) if (expira <= ahora) revocadas.delete(sid);
  return revocadas.size;
}

function estaRevocada(sid, ahora = Date.now()) {
  if (!sid) return false;
  const expira = revocadas.get(sid);
  return expira !== undefined && expira > ahora;
}

/** Cierra la sesión `sid` hasta `expiraMs` (cuando habría vencido su último token). */
async function revocar(sid, iduser, expiraMs, ahora = Date.now()) {
  if (!sid || !(expiraMs > ahora)) return false;
  revocadas.set(sid, Math.max(expiraMs, revocadas.get(sid) || 0));
  await tblsesionrevocada.upsert({ sid, iduser: iduser || null, expira: new Date(revocadas.get(sid)) });
  // Limpieza: lo vencido ya no hace falta recordarlo.
  await tblsesionrevocada.destroy({ where: { expira: { [Op.lte]: new Date(ahora) } } });
  return true;
}

function iniciarSesionesRevocadas() {
  const cargar = () => recargar().catch((error) => console.error("No se pudieron leer las sesiones cerradas:", error.message));
  cargar();
  setInterval(cargar, RECARGA_MS).unref();
}

module.exports = { estaRevocada, revocar, recargar, iniciarSesionesRevocadas };
