const {
  leerPaginacion,
  buscarPaginado,
  paginarEnMemoria,
  metaPaginacion,
  POR_PAGINA_DEFECTO,
  POR_PAGINA_MAX,
} = require("../paginacion");

// El panel web no manda `pagina`: para él todo tiene que seguir igual que
// antes (lista entera, sin bloque `paginacion`). Solo la app pagina.

function modeloFalso(filas, pk = "idx") {
  return {
    primaryKeyAttribute: pk,
    findAll: jest.fn().mockResolvedValue(filas),
    findAndCountAll: jest.fn().mockResolvedValue({ rows: filas.slice(0, 2), count: filas.length }),
  };
}

describe("leerPaginacion", () => {
  test("sin `pagina` no se pagina (el panel web)", () => {
    for (const fuente of [undefined, null, {}, { busqueda: "x" }, { pagina: "" }, { porPagina: 10 }]) {
      expect(leerPaginacion(fuente)).toBeNull();
    }
  });

  test("lee página y tamaño, también si llegan como texto de la query", () => {
    expect(leerPaginacion({ pagina: "3", porPagina: "10" })).toEqual({ pagina: 3, porPagina: 10, offset: 20 });
  });

  test("tamaño por defecto y tope", () => {
    expect(leerPaginacion({ pagina: 1 }).porPagina).toBe(POR_PAGINA_DEFECTO);
    expect(leerPaginacion({ pagina: 1, porPagina: 5000 }).porPagina).toBe(POR_PAGINA_MAX);
  });

  test("valores sin sentido no rompen: página 1, tamaño por defecto", () => {
    expect(leerPaginacion({ pagina: -4, porPagina: 0 })).toEqual({ pagina: 1, porPagina: POR_PAGINA_DEFECTO, offset: 0 });
    expect(leerPaginacion({ pagina: "abc", porPagina: "2.5" })).toEqual({ pagina: 1, porPagina: POR_PAGINA_DEFECTO, offset: 0 });
  });
});

describe("buscarPaginado", () => {
  test("sin paginación hace el findAll de siempre, con las mismas opciones", async () => {
    const modelo = modeloFalso([1, 2, 3]);
    const opciones = { where: { a: 1 } };
    const r = await buscarPaginado(modelo, opciones, null);
    expect(modelo.findAll).toHaveBeenCalledWith(opciones);
    expect(modelo.findAndCountAll).not.toHaveBeenCalled();
    expect(r).toEqual({ filas: [1, 2, 3], total: 3 });
  });

  test("con paginación limita y cuenta, con orden estable por la clave primaria", async () => {
    const modelo = modeloFalso([1, 2, 3, 4, 5]);
    const r = await buscarPaginado(modelo, { where: { a: 1 } }, { pagina: 2, porPagina: 2, offset: 2 });
    expect(modelo.findAndCountAll).toHaveBeenCalledWith({
      where: { a: 1 },
      order: [["idx", "DESC"]],
      limit: 2,
      offset: 2,
    });
    expect(r.total).toBe(5);
  });

  test("respeta el orden que ya tenía el listado y añade la clave detrás", async () => {
    const modelo = modeloFalso([1]);
    await buscarPaginado(modelo, { order: [["Fecha", "DESC"]] }, { pagina: 1, porPagina: 20, offset: 0 });
    expect(modelo.findAndCountAll.mock.calls[0][0].order).toEqual([["Fecha", "DESC"], ["idx", "DESC"]]);
  });

  test("no repite la clave si el orden ya la usa", async () => {
    const modelo = modeloFalso([1]);
    await buscarPaginado(modelo, { order: [["idx", "DESC"]] }, { pagina: 1, porPagina: 20, offset: 0 });
    expect(modelo.findAndCountAll.mock.calls[0][0].order).toEqual([["idx", "DESC"]]);
  });
});

describe("paginarEnMemoria y metaPaginacion", () => {
  const lista = Array.from({ length: 45 }, (_, i) => i + 1);

  test("recorta la página pedida", () => {
    const pag = leerPaginacion({ pagina: 3, porPagina: 20 });
    expect(paginarEnMemoria(lista, pag)).toEqual({ filas: [41, 42, 43, 44, 45], total: 45 });
  });

  test("sin paginación devuelve todo; algo que no es lista, vacío", () => {
    expect(paginarEnMemoria(lista, null).filas).toHaveLength(45);
    expect(paginarEnMemoria(undefined, null)).toEqual({ filas: [], total: 0 });
  });

  test("el bloque de la respuesta dice cuántas páginas hay", () => {
    expect(metaPaginacion({ pagina: 1, porPagina: 20 }, 45)).toEqual({
      paginacion: { pagina: 1, porPagina: 20, total: 45, paginas: 3 },
    });
    expect(metaPaginacion({ pagina: 1, porPagina: 20 }, 0).paginacion.paginas).toBe(1);
  });

  test("sin paginación no añade nada a la respuesta", () => {
    expect(metaPaginacion(null, 45)).toEqual({});
  });
});
