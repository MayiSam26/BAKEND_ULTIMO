const tblapadrinado = require("../Entity/Apadrinado");

// Estados en los que la mascota sigue viviendo en el albergue. "proceso"
// cuenta: la adopción está iniciada pero el animal todavía no se va, que es
// justamente el caso que sostiene un padrino.
const ANIMALES_EN_ALBERGUE = ["En refugio", "proceso"];

/**
 * Cierra los apadrinamientos activos de una mascota cuando esta deja el
 * albergue (adoptada o fallecida): el padrino ya no tiene a quién sostener,
 * y dejarlos en "Activo" inflaba el conteo de apadrinamientos vigentes.
 *
 * Se llama desde todos los puntos que cambian el estado del animal. No lanza
 * excepciones: si algo falla se registra en consola pero no tumba la
 * operación principal (actualizar la mascota o la adopción), que es lo que
 * el usuario realmente pidió.
 *
 * @returns {Promise<number>} cuántos apadrinamientos se cerraron.
 */
async function cerrarApadrinamientosSiSalio(idanimal, nuevoEstado) {
  try {
    if (!idanimal || !nuevoEstado) return 0;
    if (ANIMALES_EN_ALBERGUE.includes(nuevoEstado)) return 0;

    const [cerrados] = await tblapadrinado.update(
      { estado: "Finalizado" },
      { where: { idanimal, estado: "Activo" } }
    );

    if (cerrados > 0) {
      console.log(
        `Apadrinamientos cerrados automáticamente: ${cerrados} (animal ${idanimal} pasó a "${nuevoEstado}")`
      );
    }
    return cerrados;
  } catch (error) {
    console.error("No se pudieron cerrar los apadrinamientos del animal", idanimal, error);
    return 0;
  }
}

module.exports = { cerrarApadrinamientosSiSalio, ANIMALES_EN_ALBERGUE };
