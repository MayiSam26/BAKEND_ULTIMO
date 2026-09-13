const tblpushtoken = require("../Entity/PushToken");
const { esTokenExpo, enviarPush, leerRecibos } = require("../helpers/push");

const ESPERA_RECIBOS_MS = 4000;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// POST /push/prueba  (botón de Mi cuenta en la app)
// Manda una notificación a los teléfonos de quien la pide y, unos segundos
// después, revisa los recibos para decir en la app si falló la configuración.
exports.probar = async (req, res, { fetchImpl = fetch, espera = ESPERA_RECIBOS_MS } = {}) => {
  try {
    const r = await enviarPush(
      [req.user.iduser],
      { titulo: "Notificación de prueba", cuerpo: "Si ves esto, las notificaciones funcionan en este teléfono.", datos: { url: "/cuenta" } },
      { fetchImpl }
    );
    if (!r.telefonos) {
      return res.json({ code: "001", message: "No hay ningún teléfono registrado con tu cuenta. Abre la app instalada y acepta las notificaciones.", data: r });
    }
    if (!r.enviados) {
      const motivo = r.invalidos ? "este teléfono ya no está registrado; vuelve a activarlas" : r.errores[0] || "motivo desconocido";
      return res.json({ code: "001", message: `No se pudo enviar: ${motivo}.`, data: r });
    }
    await esperar(espera);
    let fallos = [];
    try {
      fallos = await leerRecibos(r.tickets, { fetchImpl });
    } catch {
      // Sin recibos todavía: se da por enviada.
    }
    if (fallos.length) {
      return res.json({ code: "001", message: `Expo no pudo entregarla: ${fallos[0]}`, data: { ...r, fallos } });
    }
    const n = r.enviados;
    res.json({ code: "000", message: `Enviada a ${n} ${n === 1 ? "teléfono" : "teléfonos"}. Debería llegar en unos segundos.`, data: r });
  } catch (error) {
    console.error("Error en la prueba de notificaciones:", error);
    res.status(500).json({ code: "001", message: "No se pudo enviar la prueba.", data: null });
  }
};

// POST /push/registrar  { token, plataforma }
// El teléfono queda asociado al usuario de la sesión. Si ese teléfono antes
// era de otra cuenta (se cerró sesión y entró otro), pasa al nuevo usuario.
exports.registrar = async (req, res) => {
  try {
    const { token, plataforma } = req.body || {};
    if (!esTokenExpo(token)) {
      return res.status(400).json({ code: "001", message: "Token de notificaciones no válido.", data: null });
    }
    const datos = { iduser: req.user.iduser, plataforma: plataforma ? String(plataforma).slice(0, 20) : null, actualizado: new Date() };
    const existe = await tblpushtoken.findOne({ where: { token } });
    if (existe) await existe.update(datos);
    else await tblpushtoken.create({ token, ...datos });
    res.json({ code: "000", message: "Notificaciones activadas en este teléfono.", data: null });
  } catch (error) {
    console.error("Error registrando token push:", error);
    res.status(500).json({ code: "001", message: "No se pudieron activar las notificaciones.", data: null });
  }
};

// POST /push/quitar  { token }  (al cerrar sesión en la app)
exports.quitar = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (esTokenExpo(token)) await tblpushtoken.destroy({ where: { token, iduser: req.user.iduser } });
    res.json({ code: "000", message: "Notificaciones desactivadas en este teléfono.", data: null });
  } catch (error) {
    console.error("Error quitando token push:", error);
    res.status(500).json({ code: "001", message: "No se pudieron desactivar las notificaciones.", data: null });
  }
};
