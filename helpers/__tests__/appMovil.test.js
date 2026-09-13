const multer = require("multer");
const { mensajeSubida } = require("../errorSubida");
const { ahoraEnLima } = require("../recordatorios");
const { limpiarFallo } = require("../../controller/ErrorAppController");

describe("mensajeSubida", () => {
  test("imagen muy pesada, en español", () => {
    expect(mensajeSubida(new multer.MulterError("LIMIT_FILE_SIZE"))).toMatch(/5 MB/);
  });
  test("tipo de archivo rechazado: se usa el mensaje del filtro", () => {
    expect(mensajeSubida(new Error("Solo se permiten imágenes (jpg, png, webp, gif)"))).toBe("Solo se permiten imágenes (jpg, png, webp, gif)");
  });
});

describe("ahoraEnLima", () => {
  test("Lima es UTC-5: las 12:30 UTC son las 7 de la mañana", () => {
    expect(ahoraEnLima(Date.UTC(2026, 8, 13, 12, 30))).toEqual({ dia: "2026-09-13", hora: 7 });
  });
  test("las 3:00 UTC todavía son el día anterior en Lima", () => {
    expect(ahoraEnLima(Date.UTC(2026, 8, 13, 3, 0))).toEqual({ dia: "2026-09-12", hora: 22 });
  });
});

describe("limpiarFallo", () => {
  test("recorta, toma el usuario del token y no del cuerpo", () => {
    const f = limpiarFallo(
      { lugar: "pantalla /colitas", mensaje: "x".repeat(900), pila: "p", plataforma: "android 14", version: "1.0.0", fecha: "2026-09-13T10:00:00Z", iduser: 99 },
      { iduser: 3, usuario: "lpereda" }
    );
    expect(f.mensaje).toHaveLength(500);
    expect(f.iduser).toBe(3);
    expect(f.usuario).toBe("lpereda");
    expect(f.fecha.toISOString()).toBe("2026-09-13T10:00:00.000Z");
  });
  test("sin sesión queda sin usuario; fecha rota = ahora", () => {
    const f = limpiarFallo({ lugar: "global", mensaje: "boom", fecha: "no es fecha" }, undefined);
    expect(f.iduser).toBeNull();
    expect(Math.abs(f.fecha.getTime() - Date.now())).toBeLessThan(5000);
  });
  test("sin mensaje o sin lugar se descarta", () => {
    expect(limpiarFallo({ lugar: "x" })).toBeNull();
    expect(limpiarFallo({ mensaje: "x" })).toBeNull();
    expect(limpiarFallo("texto")).toBeNull();
  });
});
