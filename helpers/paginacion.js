// Paginación opcional de los listados. El panel web no la pide y sigue
// recibiendo la lista entera, igual que antes; la app móvil manda `pagina`
// (y si quiere `porPagina`) y recibe solo ese trozo más un bloque
// `paginacion` con el total, para saber cuándo dejar de pedir.
//
// Los listados que responden a GET la leen de la query (?pagina=2) y los de
// POST del cuerpo, junto a sus filtros.

const POR_PAGINA_DEFECTO = 20;
const POR_PAGINA_MAX = 100;

function entero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) ? n : NaN;
}

/**
 * Lee `pagina` y `porPagina` de un objeto (req.body o req.query). Devuelve
 * null si no se pidió paginar, para que el llamador conserve el
 * comportamiento de siempre.
 */
function leerPaginacion(fuente) {
  if (!fuente || fuente.pagina === undefined || fuente.pagina === null || fuente.pagina === "") {
    return null;
  }
  const pagina = Math.max(1, entero(fuente.pagina) || 1);
  let porPagina = entero(fuente.porPagina);
  if (!(porPagina > 0)) porPagina = POR_PAGINA_DEFECTO;
  porPagina = Math.min(porPagina, POR_PAGINA_MAX);
  return { pagina, porPagina, offset: (pagina - 1) * porPagina };
}

/**
 * findAll, o findAndCountAll con límite si hay paginación. Al paginar se
 * añade la clave primaria como último criterio de orden: sin un orden
 * estable, MySQL puede repetir o saltarse filas entre una página y la
 * siguiente.
 */
async function buscarPaginado(modelo, opciones, pag) {
  if (!pag) {
    const filas = await modelo.findAll(opciones);
    return { filas, total: filas.length };
  }
  const pk = modelo.primaryKeyAttribute;
  const order = [...(opciones.order || [])];
  if (pk && !order.some((o) => (Array.isArray(o) ? o[0] : o) === pk)) {
    order.push([pk, "DESC"]);
  }
  const { rows, count } = await modelo.findAndCountAll({
    ...opciones,
    order,
    limit: pag.porPagina,
    offset: pag.offset,
  });
  return { filas: rows, total: count };
}

/** Para listados que ya llegan enteros (procedimientos almacenados). */
function paginarEnMemoria(filas, pag) {
  const lista = Array.isArray(filas) ? filas : [];
  if (!pag) return { filas: lista, total: lista.length };
  return { filas: lista.slice(pag.offset, pag.offset + pag.porPagina), total: lista.length };
}

/** Bloque `paginacion` de la respuesta, o {} si no se pidió paginar. */
function metaPaginacion(pag, total) {
  if (!pag) return {};
  return {
    paginacion: {
      pagina: pag.pagina,
      porPagina: pag.porPagina,
      total,
      paginas: Math.max(1, Math.ceil(total / pag.porPagina)),
    },
  };
}

module.exports = {
  POR_PAGINA_DEFECTO,
  POR_PAGINA_MAX,
  leerPaginacion,
  buscarPaginado,
  paginarEnMemoria,
  metaPaginacion,
};
