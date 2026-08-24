const moment = require("moment");

// La edad de un animal no se guarda: se calcula cada vez que se muestra.
//
// Guardar "3 años" en una columna significa que el dato nace correcto y se
// vuelve falso solo con que pase el tiempo. En su lugar se guarda la fecha de
// nacimiento y la edad se deriva de ahí, así que siempre está al día.
//
// En un rescate casi nunca se conoce la fecha exacta, pero sí se estima la
// edad al ingresar ("como 2 años"). Esa estimación es equivalente a una fecha
// de nacimiento: ingreso menos 2 años. Por eso alcanza con dos datos —
// fecha_nacimiento y si es exacta o estimada— para cubrir los dos casos con
// una sola fórmula.

/** Texto legible a partir de una cantidad de meses. */
function textoDesdeMeses(meses) {
  if (meses < 0) return null;
  if (meses < 1) return "menos de 1 mes";
  if (meses < 12) return meses === 1 ? "1 mes" : `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const parteAnios = anios === 1 ? "1 año" : `${anios} años`;
  if (resto === 0) return parteAnios;
  return `${parteAnios}, ${resto === 1 ? "1 mes" : `${resto} meses`}`;
}

/**
 * Convierte una estimación hecha en una fecha dada ("N años al ingresar") en
 * la fecha de nacimiento que implica. Devuelve null si no hay datos válidos.
 */
function nacimientoDesdeEstimacion(edadAprox, fechaReferencia) {
  const anios = Number(edadAprox);
  if (!Number.isFinite(anios) || anios < 0 || anios > 40) return null;
  const ref = moment(fechaReferencia);
  if (!ref.isValid()) return null;
  return ref.subtract(Math.round(anios * 12), "months").format("YYYY-MM-DD");
}

/**
 * Calcula la edad actual de un animal.
 * Devuelve { meses, texto, aproximada } o texto null si no se puede saber.
 */
function calcularEdad(animal, hoy) {
  const ahora = hoy ? moment(hoy) : moment();

  // Camino principal: hay fecha de nacimiento (real o deducida de la
  // estimación de ingreso, que es lo mismo matemáticamente).
  let nacimiento = animal.fecha_nacimiento || null;
  let aproximada = !animal.nacimiento_exacto;

  // Fichas antiguas que todavía no tienen fecha: se deduce de la edad
  // declarada al ingresar, para que igual envejezcan solas.
  if (!nacimiento) {
    nacimiento = nacimientoDesdeEstimacion(animal.Edada_Aprox, animal.Fecha_Ingreso);
    aproximada = true;
  }

  if (!nacimiento) {
    // Sin nada con qué calcular: se devuelve lo que haya escrito a mano.
    const crudo = animal.Edada_Aprox ? String(animal.Edada_Aprox).trim() : "";
    return { meses: null, texto: crudo || null, aproximada: true };
  }

  const inicio = moment(nacimiento, "YYYY-MM-DD");
  if (!inicio.isValid() || inicio.isAfter(ahora)) {
    return { meses: null, texto: null, aproximada };
  }

  const meses = ahora.diff(inicio, "months");
  const texto = textoDesdeMeses(meses);
  return {
    meses,
    texto: texto && aproximada ? `~${texto}` : texto,
    aproximada,
  };
}

/** Agrega los campos derivados de edad a una fila ya convertida a objeto. */
function conEdad(fila, hoy) {
  const { meses, texto, aproximada } = calcularEdad(fila, hoy);
  return { ...fila, edad_meses: meses, edad_texto: texto, edad_aproximada: aproximada };
}

module.exports = { calcularEdad, conEdad, textoDesdeMeses, nacimientoDesdeEstimacion };
