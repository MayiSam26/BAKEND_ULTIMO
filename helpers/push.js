const { Op } = require("sequelize");
const tblpushtoken = require("../Entity/PushToken");
const tblUser = require("../Entity/User");
const tblpermiso = require("../Entity/Permiso");

// Notificaciones al teléfono con el servicio de Expo (la app móvil está hecha
// con Expo). No hace falta cuenta ni clave para enviar; si en Expo se activa
// "push security", poner la variable EXPO_ACCESS_TOKEN en Railway.

const URL_EXPO = "https://exp.host/--/api/v2/push/send";
const POR_TANDA = 100; // máximo que acepta Expo por petición

const esTokenExpo = (t) => typeof t === "string" && t.length <= 200 && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(t);

/**
 * Usuarios activos que ven una sección en la app: el Administrador siempre;
 * los demás roles solo si su permiso está en "visible" (la app oculta la
 * sección si no hay fila, así que tampoco se les avisa).
 */
async function usuariosQueVen(seccion, { roles } = {}) {
  const permisos = await tblpermiso.findAll({ where: { seccion, visible: true } });
  let conPermiso = ["Administrador", ...permisos.map((p) => p.rol)];
  if (roles) conPermiso = conPermiso.filter((r) => roles.includes(r));
  if (!conPermiso.length) return [];
  const usuarios = await tblUser.findAll({
    where: { activo: true, rol: { [Op.in]: [...new Set(conPermiso)] } },
    attributes: ["iduser"],
  });
  return usuarios.map((u) => u.iduser);
}

/**
 * Manda una notificación a todos los teléfonos registrados de esos usuarios.
 * `datos.url` es la pantalla de la app que se abre al tocarla.
 * Los teléfonos que Expo da por desinstalados se borran de la tabla.
 */
async function enviarPush(idsUsuarios, { titulo, cuerpo, datos }, { fetchImpl = fetch } = {}) {
  if (!idsUsuarios || !idsUsuarios.length) return { enviados: 0, invalidos: 0 };
  const tokens = await tblpushtoken.findAll({ where: { iduser: { [Op.in]: idsUsuarios } } });
  if (!tokens.length) return { enviados: 0, invalidos: 0 };

  const mensajes = tokens.map((t) => ({
    to: t.token,
    title: titulo,
    body: cuerpo,
    data: datos || {},
    sound: "default",
    priority: "high",
    channelId: "avisos",
  }));
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  let enviados = 0;
  const invalidos = [];
  for (let i = 0; i < mensajes.length; i += POR_TANDA) {
    const tanda = mensajes.slice(i, i + POR_TANDA);
    try {
      const r = await fetchImpl(URL_EXPO, { method: "POST", headers, body: JSON.stringify(tanda) });
      const respuesta = await r.json().catch(() => null);
      const tickets = (respuesta && respuesta.data) || [];
      tickets.forEach((ticket, k) => {
        if (ticket && ticket.status === "ok") enviados++;
        else if (ticket && ticket.details && ticket.details.error === "DeviceNotRegistered") invalidos.push(tanda[k].to);
      });
      if (!r.ok) console.error(`Push: Expo respondió HTTP ${r.status}`);
    } catch (error) {
      console.error("Push: no se pudo contactar a Expo:", error.message);
    }
  }
  if (invalidos.length) await tblpushtoken.destroy({ where: { token: { [Op.in]: invalidos } } });
  return { enviados, invalidos: invalidos.length };
}

/** Para llamar después de responder: un fallo al notificar nunca rompe la operación. */
function notificarSinEsperar(tarea) {
  Promise.resolve()
    .then(tarea)
    .catch((error) => console.error("Push:", error.message));
}

module.exports = { esTokenExpo, usuariosQueVen, enviarPush, notificarSinEsperar };
