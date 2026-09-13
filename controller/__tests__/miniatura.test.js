const { archivoValido, anchoPedido, ANCHOS } = require("../MiniaturaController");

// La ruta de miniaturas es pública y lee archivos del disco a partir de un
// nombre que manda el cliente: lo primero es que no se pueda salir de
// uploads/ ni pedir tamaños arbitrarios.

describe("archivoValido", () => {
  test("acepta los nombres que genera la subida", () => {
    // "peluchin}.jpeg" existe de verdad en uploads/: la subida conserva el
    // nombre original, así que no se puede filtrar por caracteres.
    for (const n of ["1785771892227-foto_optimizada_lote2_4.jpg", "perfil-1785771892227.png", "foto (1).webp", "peluchin}.jpeg", "Mascota ñandú.jpg"]) {
      expect(archivoValido(n)).toBe(true);
    }
  });

  test("rechaza rutas y archivos ocultos", () => {
    for (const n of ["../index.js", "..\\.env", "a/b.jpg", ".env", "..", "", "foto.jpg\0.png", "x".repeat(300), null, 5]) {
      expect(archivoValido(n)).toBe(false);
    }
  });
});

describe("anchoPedido", () => {
  test("solo los anchos permitidos; cualquier otro cae en el de defecto", () => {
    for (const w of ANCHOS) expect(anchoPedido(String(w))).toBe(w);
    for (const w of [undefined, "", "321", "99999", "abc", -160]) expect(anchoPedido(w)).toBe(320);
  });
});
