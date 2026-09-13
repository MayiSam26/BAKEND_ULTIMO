const tblerrorapp = require("../Entity/ErrorApp");

const MAX_POR_ENVIO = 20;
const MAX_LISTA = 200;

const texto = (v, largo) => (v === undefined || v === null ? null : String(v).slice(0, largo));

/** Deja un fallo recibido listo para guardar, o null si no trae lo mínimo. */
function limpiarFallo(f, user) {
  if (!f || typeof f !== "object") return null;
  const mensaje = texto(f.mensaje, 500);
  const lugar = texto(f.lugar, 120);
  if (!mensaje || !lugar) return null;
  const fecha = new Date(f.fecha);
  return {
    iduser: user ? user.iduser || null : null,
    usuario: user ? texto(user.usuario, 60) : null,
    lugar,
    mensaje,
    pila: texto(f.pila, 3000),
    plataforma: texto(f.plataforma, 60),
    version: texto(f.version, 20),
    // Si el reloj del teléfono manda algo raro, vale la hora de llegada.
    fecha: Number.isNaN(fecha.getTime()) ? new Date() : fecha,
  };
}

// POST /app-errores  { fallos: [...] }  (con o sin sesión)
exports.registrar = async (req, res) => {
  try {
    const lista = Array.isArray(req.body && req.body.fallos) ? req.body.fallos.slice(0, MAX_POR_ENVIO) : [];
    const filas = lista.map((f) => limpiarFallo(f, req.user)).filter(Boolean);
    if (filas.length) await tblerrorapp.bulkCreate(filas);
    res.json({ code: "000", message: "Recibido", data: { guardados: filas.length } });
  } catch (error) {
    console.error("Error guardando fallos de la app:", error);
    res.status(500).json({ code: "001", message: "No se pudieron guardar los fallos.", data: null });
  }
};

// GET /app-errores/list  (Administrador): los más recientes primero
exports.listar = async (req, res) => {
  try {
    const data = await tblerrorapp.findAll({ order: [["recibido", "DESC"]], limit: MAX_LISTA });
    res.json({ code: "000", message: "success", data });
  } catch (error) {
    console.error("Error listando fallos de la app:", error);
    res.status(500).json({ code: "001", message: "No se pudieron cargar los fallos.", data: null });
  }
};

// DELETE /app-errores  (Administrador): vaciar la lista una vez revisada
exports.vaciar = async (req, res) => {
  try {
    const borrados = await tblerrorapp.destroy({ where: {} });
    res.json({ code: "000", message: "Lista de fallos vaciada.", data: { borrados } });
  } catch (error) {
    console.error("Error vaciando fallos de la app:", error);
    res.status(500).json({ code: "001", message: "No se pudo vaciar la lista.", data: null });
  }
};

exports.limpiarFallo = limpiarFallo;
