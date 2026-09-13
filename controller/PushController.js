const tblpushtoken = require("../Entity/PushToken");
const { esTokenExpo } = require("../helpers/push");

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
