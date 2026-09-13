const { Op } = require("sequelize");
const tblveterinaria = require("../Entity/Veterinaria");
const tblvoluntariovisita = require("../Entity/VoluntarioVisita");
const { usuariosQueVen, enviarPush } = require("./push");

// Recordatorio de cada mañana, entre las 8:00 y las 9:00 de Lima:
// - Administrador y Veterinario: controles veterinarios vencidos o de hoy.
// - Cada voluntario: sus visitas al refugio de hoy.
// Se revisa cada 10 minutos y se envía una sola vez al día. Si el servidor se
// reinicia en esa hora podría repetirse ese día (poco probable y sin daño).

const HORA = 8;
const CADA = 10 * 60 * 1000;

/** Día "YYYY-MM-DD" y hora de Lima (UTC-5 todo el año, sin horario de verano). */
function ahoraEnLima(ms = Date.now()) {
  const iso = new Date(ms - 5 * 3600 * 1000).toISOString();
  return { dia: iso.slice(0, 10), hora: Number(iso.slice(11, 13)) };
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

async function enviarRecordatorios(dia) {
  const pendiente = { [Op.or]: [{ Estado: null }, { Estado: { [Op.ne]: "Realizado" } }] };

  const controles = await tblveterinaria.count({ where: { proxima_fecha: { [Op.lte]: dia }, ...pendiente } });
  if (controles > 0) {
    const ids = await usuariosQueVen("veterinaria", { roles: ["Administrador", "Veterinario"] });
    await enviarPush(ids, {
      titulo: "Controles veterinarios",
      cuerpo: `Hay ${plural(controles, "control pendiente", "controles pendientes")} para hoy o ya vencidos.`,
      datos: { url: "/veterinaria" },
    });
  }

  const visitas = await tblvoluntariovisita.findAll({ where: { fecha: dia, ...pendiente }, attributes: ["iduser"] });
  const porVoluntario = {};
  visitas.forEach((v) => (porVoluntario[v.iduser] = (porVoluntario[v.iduser] || 0) + 1));
  for (const [iduser, n] of Object.entries(porVoluntario)) {
    await enviarPush([Number(iduser)], {
      titulo: "Visita al refugio",
      cuerpo: n === 1 ? "Hoy tienes una visita asignada." : `Hoy tienes ${n} visitas asignadas.`,
      datos: { url: "/voluntariado" },
    });
  }
  return { controles, voluntarios: Object.keys(porVoluntario).length };
}

function iniciarRecordatorios() {
  let ultimoDia = null;
  const revisar = async () => {
    const { dia, hora } = ahoraEnLima();
    if (hora !== HORA || ultimoDia === dia) return;
    ultimoDia = dia;
    try {
      const r = await enviarRecordatorios(dia);
      console.log(`Recordatorios ${dia}: ${r.controles} controles, ${r.voluntarios} voluntarios con visita.`);
    } catch (error) {
      console.error("Error enviando recordatorios:", error.message);
    }
  };
  setInterval(revisar, CADA).unref();
  revisar();
}

module.exports = { ahoraEnLima, enviarRecordatorios, iniciarRecordatorios };
