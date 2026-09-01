const moment = require("moment");

// Validación y normalización de la ficha del adoptante.
//
// Vive aparte del controlador porque la ficha se crea desde tres sitios: el
// formulario del panel, la edición, y la solicitud pública de la web. Antes,
// cada uno validaba lo suyo (o no validaba), y así fue como terminó un correo
// escrito dentro del campo Dirección.

const EDAD_MINIMA = 18;

const TIPOS_VIVIENDA = ["Casa", "Departamento", "Quinta", "Otro"];
const TENENCIAS = ["Propia", "Alquilada", "Familiar"];

/**
 * Correo válido. Deliberadamente laxo: la regla estricta del estándar rechaza
 * direcciones que en la práctica funcionan. Lo que importa es descartar lo que
 * claramente no es un correo.
 */
function correoValido(valor) {
  if (typeof valor !== "string") return false;
  const v = valor.trim();
  if (v.length === 0 || v.length > 150) return false;
  if (/\s/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

/** Teléfono peruano: 9 dígitos. Mismo criterio que ya usa la solicitud pública. */
function telefonoValido(valor) {
  return typeof valor === "string" && /^\d{9}$/.test(valor.trim());
}

/**
 * Edad cumplida a la fecha indicada. Devuelve null si la fecha no sirve para
 * calcularla (vacía, inválida o en el futuro).
 */
function edadEnAnios(fechaNacimiento, hoy) {
  if (!fechaNacimiento) return null;
  const nacimiento = moment(fechaNacimiento, "YYYY-MM-DD", true);
  if (!nacimiento.isValid()) return null;
  const ahora = hoy ? moment(hoy) : moment();
  if (nacimiento.isAfter(ahora)) return null;
  return ahora.diff(nacimiento, "years");
}

/**
 * Un menor de edad no puede firmar el contrato de adopción, así que tampoco
 * debería quedar registrado como adoptante. Sin fecha de nacimiento no se
 * bloquea: las 12 fichas que ya existen no la tienen y seguirían siendo
 * editables.
 */
function esMayorDeEdad(fechaNacimiento, hoy) {
  const edad = edadEnAnios(fechaNacimiento, hoy);
  if (edad === null) return true;
  return edad >= EDAD_MINIMA;
}

/** "si"/"no"/true/1 → booleano. Devuelve null cuando no se respondió. */
function aBooleano(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor !== 0;
  const v = String(valor).trim().toLowerCase();
  if (["1", "true", "si", "sí", "s"].includes(v)) return true;
  if (["0", "false", "no", "n"].includes(v)) return false;
  return null;
}

/** Texto recortado, o null si quedó vacío (para no guardar cadenas en blanco). */
function textoOpcional(valor, maximo) {
  if (valor === undefined || valor === null) return null;
  const v = String(valor).trim();
  if (v === "") return null;
  return maximo ? v.slice(0, maximo) : v;
}

/** Valor de una lista cerrada; cualquier otra cosa se descarta en vez de guardarse. */
function deLista(valor, lista) {
  const v = textoOpcional(valor);
  if (!v) return null;
  const encontrado = lista.find((o) => o.toLowerCase() === v.toLowerCase());
  return encontrado || null;
}

/**
 * Revisa la ficha y devuelve el primer problema encontrado, o null si está
 * bien. Solo se valida lo que viene: en una edición parcial, un campo ausente
 * significa "no lo toques".
 */
function validarAdoptante(datos, hoy) {
  if (datos.correo !== undefined && datos.correo !== null && String(datos.correo).trim() !== "") {
    if (!correoValido(datos.correo)) {
      return "El correo electrónico no tiene un formato válido.";
    }
  }

  for (const campo of ["telefono", "telefono_referencia"]) {
    const valor = datos[campo];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      if (!telefonoValido(String(valor))) {
        const nombre = campo === "telefono" ? "El teléfono" : "El teléfono de referencia";
        return `${nombre} debe tener 9 dígitos numéricos.`;
      }
    }
  }

  if (datos.fecha_nacimiento !== undefined && datos.fecha_nacimiento !== null && String(datos.fecha_nacimiento).trim() !== "") {
    const nacimiento = moment(String(datos.fecha_nacimiento).slice(0, 10), "YYYY-MM-DD", true);
    if (!nacimiento.isValid()) {
      return "La fecha de nacimiento no es válida.";
    }
    if (nacimiento.isAfter(hoy ? moment(hoy) : moment())) {
      return "La fecha de nacimiento no puede estar en el futuro.";
    }
    if (!esMayorDeEdad(String(datos.fecha_nacimiento).slice(0, 10), hoy)) {
      return `El adoptante debe ser mayor de ${EDAD_MINIMA} años para firmar el contrato de adopción.`;
    }
  }

  return null;
}

/**
 * Deja los campos nuevos listos para guardar. Solo devuelve los que vinieron,
 * para que una edición parcial no borre lo que no se tocó.
 */
function normalizarAdoptante(datos) {
  const salida = {};
  const asignar = (campo, valor) => {
    if (datos[campo] !== undefined) salida[campo] = valor;
  };

  asignar("correo", textoOpcional(datos.correo, 150));
  asignar("distrito", textoOpcional(datos.distrito, 100));
  asignar("telefono_referencia", textoOpcional(datos.telefono_referencia, 20));
  asignar("fecha_nacimiento", textoOpcional(datos.fecha_nacimiento) ? String(datos.fecha_nacimiento).slice(0, 10) : null);
  asignar("tipo_vivienda", deLista(datos.tipo_vivienda, TIPOS_VIVIENDA));
  asignar("tenencia_vivienda", deLista(datos.tenencia_vivienda, TENENCIAS));
  asignar("tiene_patio", aBooleano(datos.tiene_patio));
  asignar("tiene_otras_mascotas", aBooleano(datos.tiene_otras_mascotas));
  asignar("detalle_mascotas", textoOpcional(datos.detalle_mascotas, 255));

  // Si dijo que no tiene otras mascotas, el detalle sobra: guardarlo dejaría
  // una contradicción en la ficha.
  if (salida.tiene_otras_mascotas === false) salida.detalle_mascotas = null;

  return salida;
}

module.exports = {
  EDAD_MINIMA,
  TIPOS_VIVIENDA,
  TENENCIAS,
  correoValido,
  telefonoValido,
  edadEnAnios,
  esMayorDeEdad,
  aBooleano,
  validarAdoptante,
  normalizarAdoptante,
};
