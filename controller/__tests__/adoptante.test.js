const {
  correoValido,
  telefonoValido,
  edadEnAnios,
  esMayorDeEdad,
  aBooleano,
  validarAdoptante,
  normalizarAdoptante,
} = require("../../helpers/adoptante");

// La ficha del adoptante se crea desde el panel, desde la edición y desde el
// formulario público de la web. El formulario público es el que importa más:
// cualquiera puede llamar al endpoint sin pasar por el navegador, así que la
// validación del servidor es la única que de verdad protege los datos.

const HOY = "2026-08-31";

describe("correoValido", () => {
  test("acepta correos normales", () => {
    for (const c of ["luna@hotmail.com.pe", "a.b-c@gmail.com", "refugiocolitasyamor@gmail.com"]) {
      expect(correoValido(c)).toBe(true);
    }
  });

  test("rechaza lo que claramente no es un correo", () => {
    for (const c of ["", "   ", "masadad", "hola@", "@dominio.com", "a@b", "con espacio@x.com", null, 42]) {
      expect(correoValido(c)).toBe(false);
    }
  });
});

describe("telefonoValido", () => {
  test("nueve dígitos, como en Perú", () => {
    expect(telefonoValido("981557865")).toBe(true);
  });

  test("rechaza largos distintos y texto", () => {
    for (const t of ["98155786", "9815578650", "98155786a", "", "+51981557865"]) {
      expect(telefonoValido(t)).toBe(false);
    }
  });
});

describe("edad y mayoría de edad", () => {
  test("calcula los años cumplidos", () => {
    expect(edadEnAnios("2000-08-31", HOY)).toBe(26);
    // Un día antes del cumpleaños todavía no los cumplió.
    expect(edadEnAnios("2000-09-01", HOY)).toBe(25);
  });

  test("bloquea a un menor de edad", () => {
    expect(esMayorDeEdad("2010-01-01", HOY)).toBe(false);
  });

  test("el día exacto en que cumple 18 ya puede firmar", () => {
    expect(esMayorDeEdad("2008-08-31", HOY)).toBe(true);
    expect(esMayorDeEdad("2008-09-01", HOY)).toBe(false);
  });

  test("sin fecha de nacimiento no se bloquea: las fichas viejas no la tienen", () => {
    for (const f of [null, undefined, ""]) {
      expect(esMayorDeEdad(f, HOY)).toBe(true);
    }
  });

  test("una fecha futura no produce una edad negativa", () => {
    expect(edadEnAnios("2030-01-01", HOY)).toBeNull();
  });
});

describe("aBooleano", () => {
  test("entiende las formas en que llega un sí o un no", () => {
    for (const v of [true, 1, "1", "si", "Sí", "true"]) expect(aBooleano(v)).toBe(true);
    for (const v of [false, 0, "0", "no", "No", "false"]) expect(aBooleano(v)).toBe(false);
  });

  test("sin responder es null, que no es lo mismo que 'no'", () => {
    for (const v of [undefined, null, "", "cualquiera"]) expect(aBooleano(v)).toBeNull();
  });
});

describe("validarAdoptante", () => {
  test("una ficha completa y correcta pasa", () => {
    expect(
      validarAdoptante(
        { correo: "ana@gmail.com", telefono: "981557865", telefono_referencia: "912141195", fecha_nacimiento: "1995-04-10" },
        HOY
      )
    ).toBeNull();
  });

  test("avisa del correo mal escrito", () => {
    expect(validarAdoptante({ correo: "masadad" }, HOY)).toMatch(/correo/i);
  });

  test("avisa del teléfono de referencia por separado", () => {
    const error = validarAdoptante({ telefono: "981557865", telefono_referencia: "123" }, HOY);
    expect(error).toMatch(/referencia/i);
  });

  test("no deja registrar a un menor de edad", () => {
    expect(validarAdoptante({ fecha_nacimiento: "2012-05-05" }, HOY)).toMatch(/mayor de 18/i);
  });

  test("rechaza una fecha de nacimiento futura", () => {
    expect(validarAdoptante({ fecha_nacimiento: "2030-01-01" }, HOY)).toMatch(/futuro/i);
  });

  test("los campos que no vienen no se validan: una edición parcial no debe fallar", () => {
    expect(validarAdoptante({ distrito: "Bellavista" }, HOY)).toBeNull();
    expect(validarAdoptante({}, HOY)).toBeNull();
  });

  test("un campo enviado vacío se toma como 'sin dato', no como error", () => {
    expect(validarAdoptante({ correo: "", telefono_referencia: "" }, HOY)).toBeNull();
  });
});

describe("normalizarAdoptante", () => {
  test("solo devuelve los campos que llegaron", () => {
    expect(normalizarAdoptante({ distrito: "Bellavista" })).toEqual({ distrito: "Bellavista" });
  });

  test("recorta espacios y convierte el vacío en null", () => {
    expect(normalizarAdoptante({ correo: "  ana@gmail.com  " }).correo).toBe("ana@gmail.com");
    expect(normalizarAdoptante({ distrito: "   " }).distrito).toBeNull();
  });

  test("un tipo de vivienda inventado no se guarda", () => {
    expect(normalizarAdoptante({ tipo_vivienda: "Castillo" }).tipo_vivienda).toBeNull();
    expect(normalizarAdoptante({ tipo_vivienda: "casa" }).tipo_vivienda).toBe("Casa");
  });

  test("una tenencia fuera de la lista tampoco", () => {
    expect(normalizarAdoptante({ tenencia_vivienda: "prestada" }).tenencia_vivienda).toBeNull();
    expect(normalizarAdoptante({ tenencia_vivienda: "ALQUILADA" }).tenencia_vivienda).toBe("Alquilada");
  });

  test("si no tiene otras mascotas, el detalle se borra en vez de contradecir la ficha", () => {
    const r = normalizarAdoptante({ tiene_otras_mascotas: "no", detalle_mascotas: "un gato" });
    expect(r.tiene_otras_mascotas).toBe(false);
    expect(r.detalle_mascotas).toBeNull();
  });

  test("si sí tiene, el detalle se conserva", () => {
    const r = normalizarAdoptante({ tiene_otras_mascotas: "si", detalle_mascotas: "un gato" });
    expect(r.tiene_otras_mascotas).toBe(true);
    expect(r.detalle_mascotas).toBe("un gato");
  });

  test("no inventa campos que nadie mandó", () => {
    expect(Object.keys(normalizarAdoptante({}))).toHaveLength(0);
  });
});
