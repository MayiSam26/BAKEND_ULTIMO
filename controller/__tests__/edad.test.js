const { calcularEdad, textoDesdeMeses, nacimientoDesdeEstimacion } = require("../../helpers/edad");

// Fecha fija para que los tests no cambien de resultado con el paso del tiempo.
const HOY = "2026-08-24";

describe("textoDesdeMeses", () => {
  test("menos de un mes", () => {
    expect(textoDesdeMeses(0)).toBe("menos de 1 mes");
  });
  test("singular y plural en meses", () => {
    expect(textoDesdeMeses(1)).toBe("1 mes");
    expect(textoDesdeMeses(7)).toBe("7 meses");
  });
  test("años exactos no arrastran meses", () => {
    expect(textoDesdeMeses(12)).toBe("1 año");
    expect(textoDesdeMeses(36)).toBe("3 años");
  });
  test("años con meses", () => {
    expect(textoDesdeMeses(14)).toBe("1 año, 2 meses");
    expect(textoDesdeMeses(13)).toBe("1 año, 1 mes");
  });
});

describe("nacimientoDesdeEstimacion", () => {
  test("una estimación en el ingreso equivale a una fecha de nacimiento", () => {
    expect(nacimientoDesdeEstimacion("2", "2025-03-15")).toBe("2023-03-15");
  });
  test("descarta valores que no son edades", () => {
    expect(nacimientoDesdeEstimacion("abc", "2025-03-15")).toBeNull();
    expect(nacimientoDesdeEstimacion("-1", "2025-03-15")).toBeNull();
    expect(nacimientoDesdeEstimacion("99", "2025-03-15")).toBeNull();
  });
  test("sin fecha de referencia no inventa nada", () => {
    expect(nacimientoDesdeEstimacion("2", null)).toBeNull();
  });
});

describe("calcularEdad", () => {
  test("fecha de nacimiento exacta: sin tilde de aproximación", () => {
    const r = calcularEdad(
      { fecha_nacimiento: "2023-03-24", nacimiento_exacto: true },
      HOY
    );
    expect(r.meses).toBe(41);
    expect(r.texto).toBe("3 años, 5 meses");
    expect(r.aproximada).toBe(false);
  });

  test("fecha estimada: se marca con ~", () => {
    const r = calcularEdad(
      { fecha_nacimiento: "2024-08-24", nacimiento_exacto: false },
      HOY
    );
    expect(r.texto).toBe("~2 años");
    expect(r.aproximada).toBe(true);
  });

  test("ficha antigua sin fecha: la deduce de la edad al ingresar", () => {
    // Ingresó el 24/08/2025 con "1" año estimado -> hoy debe tener ~2 años.
    const r = calcularEdad(
      { Edada_Aprox: "1", Fecha_Ingreso: "2025-08-24" },
      HOY
    );
    expect(r.texto).toBe("~2 años");
    expect(r.meses).toBe(24);
  });

  test("la edad avanza sola con el tiempo", () => {
    const animal = { fecha_nacimiento: "2024-08-24", nacimiento_exacto: true };
    expect(calcularEdad(animal, "2025-08-24").texto).toBe("1 año");
    expect(calcularEdad(animal, "2026-02-24").texto).toBe("1 año, 6 meses");
    expect(calcularEdad(animal, "2026-08-24").texto).toBe("2 años");
  });

  test("sin ningún dato aprovechable devuelve el texto original", () => {
    const r = calcularEdad({ Edada_Aprox: "cachorro" }, HOY);
    expect(r.texto).toBe("cachorro");
    expect(r.meses).toBeNull();
  });

  test("sin datos de ningún tipo no revienta", () => {
    const r = calcularEdad({}, HOY);
    expect(r.texto).toBeNull();
  });

  test("una fecha de nacimiento futura no produce edades negativas", () => {
    const r = calcularEdad(
      { fecha_nacimiento: "2030-01-01", nacimiento_exacto: true },
      HOY
    );
    expect(r.texto).toBeNull();
  });

  test("recién nacido", () => {
    const r = calcularEdad(
      { fecha_nacimiento: "2026-08-20", nacimiento_exacto: true },
      HOY
    );
    expect(r.texto).toBe("menos de 1 mes");
  });
});
