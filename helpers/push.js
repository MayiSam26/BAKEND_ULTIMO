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
  const vacio = { enviados: 0, invalidos: 0, telefonos: 0, errores: [], tickets: [] };
  if (!idsUsuarios || !idsUsuarios.length) return vacio;
  const tokens = await tblpushtoken.findAll({ where: { iduser: { [Op.in]: idsUsuarios } } });
  if (!tokens.length) return vacio;

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
  const errores = [];
  const tickets = [];
  for (let i = 0; i < mensajes.length; i += POR_TANDA) {
    const tanda = mensajes.slice(i, i + POR_TANDA);
    try {
      const r = await fetchImpl(URL_EXPO, { method: "POST", headers, body: JSON.stringify(tanda) });
      const respuesta = await r.json().catch(() => null);
      ((respuesta && respuesta.data) || []).forEach((ticket, k) => {
        if (ticket && ticket.status === "ok") {
          enviados++;
          if (ticket.id) tickets.push(ticket.id);
        } else if (ticket && ticket.details && ticket.details.error === "DeviceNotRegistered") {
          invalidos.push(tanda[k].to);
        } else if (ticket) {
          errores.push(ticket.message || (ticket.details && ticket.details.error) || "error desconocido");
        }
      });
      if (!r.ok) {
        console.error(`Push: Expo respondió HTTP ${r.status}`);
        errores.push(`Expo respondió HTTP ${r.status}`);
      }
    } catch (error) {
      console.error("Push: no se pudo contactar a Expo:", error.message);
      errores.push("No se pudo contactar al servicio de notificaciones.");
    }
  }
  if (invalidos.length) await tblpushtoken.destroy({ where: { token: { [Op.in]: invalidos } } });
  return { enviados, invalidos: invalidos.length, telefonos: tokens.length, errores, tickets };
}

/**
 * Recibos de entrega: Expo confirma después si Google (FCM) aceptó cada
 * notificación. Aquí aparecen los fallos de configuración, p. ej. una clave
 * FCM que falta o no vale (InvalidCredentials). Devuelve los mensajes de error.
 */
async function leerRecibos(ids, { fetchImpl = fetch } = {}) {
  if (!ids || !ids.length) return [];
  const r = await fetchImpl("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ids }),
  });
  const respuesta = await r.json().catch(() => null);
  return Object.values((respuesta && respuesta.data) || {})
    .filter((recibo) => recibo && recibo.status === "error")
    .map((recibo) => [recibo.details && recibo.details.error, recibo.message].filter(Boolean).join(": "));
}

/** Para llamar después de responder: un fallo al notificar nunca rompe la operación. */
function notificarSinEsperar(tarea) {
  Promise.resolve()
    .then(tarea)
    .catch((error) => console.error("Push:", error.message));
}

module.exports = { esTokenExpo, usuariosQueVen, enviarPush, leerRecibos, notificarSinEsperar };
