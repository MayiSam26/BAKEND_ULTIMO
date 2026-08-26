// La columna "content" de los canales de donacion es de tipo JSON y el sitio
// publico hace content.map(...) sobre ella. Si alguna vez se guarda como
// texto en vez de arreglo, la portada entera queda en blanco: ya paso una vez
// al actualizar los logos. Estos casos cubren esa frontera.

// Se reproduce la funcion tal como esta en el controlador (no se exporta,
// porque es un detalle interno del modulo).
function normalizarContent(valor) {
  if (valor === undefined || valor === null) return valor;
  let v = valor;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    try { v = JSON.parse(v); } catch { return []; }
  }
  return Array.isArray(v) ? v : [];
}

const CUENTA = [{ id: 1, name: "Luis Pereda Roque - 912141195" }];

describe("normalizarContent", () => {
  test("un arreglo pasa intacto", () => {
    expect(normalizarContent(CUENTA)).toEqual(CUENTA);
  });

  test("el texto JSON que manda el formulario se convierte en arreglo", () => {
    expect(normalizarContent(JSON.stringify(CUENTA))).toEqual(CUENTA);
  });

  test("aunque venga doblemente codificado", () => {
    expect(normalizarContent(JSON.stringify(JSON.stringify(CUENTA)))).toEqual(CUENTA);
  });

  test("un texto que no es JSON no rompe: devuelve arreglo vacio", () => {
    expect(normalizarContent("912141195")).toEqual([]);
  });

  test("un objeto suelto tampoco pasa como esta", () => {
    expect(normalizarContent({ id: 1, name: "algo" })).toEqual([]);
  });

  test("undefined y null se respetan (significan 'no lo toques')", () => {
    expect(normalizarContent(undefined)).toBeUndefined();
    expect(normalizarContent(null)).toBeNull();
  });

  test("lo que sale siempre se puede recorrer con .map", () => {
    for (const entrada of [CUENTA, JSON.stringify(CUENTA), "roto", {}, []]) {
      const salida = normalizarContent(entrada);
      expect(typeof salida.map).toBe("function");
    }
  });
});
