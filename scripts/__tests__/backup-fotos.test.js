const fs = require("fs");
const os = require("os");
const path = require("path");
const { rutaDeUpload, rutasEnFilas, respaldarFotos, urlDe } = require("../backup-fotos");

describe("rutaDeUpload", () => {
  test("normaliza barras de Windows y la barra inicial", () => {
    expect(rutaDeUpload("uploads\\1787-images (1).jpg")).toBe("uploads/1787-images (1).jpg");
    expect(rutaDeUpload("/uploads/a.png")).toBe("uploads/a.png");
  });
  test("ignora lo que no es una foto subida o intenta salirse de la carpeta", () => {
    for (const v of [null, 42, "", "uploads/", "https://x.com/a.png", "plan-basico.png", "uploads/../index.js", "uploads//a.jpg"]) {
      expect(rutaDeUpload(v)).toBeNull();
    }
  });
});

test("rutasEnFilas junta las rutas de todas las tablas sin repetir", () => {
  const rutas = rutasEnFilas({
    tblanimal: [{ idanimal: 1, foto: "uploads/a.jpg", nombre: "Luna" }],
    tbluser: [{ iduser: 3, foto: "uploads\\a.jpg" }, { iduser: 4, foto: null }],
    tblingreso: [{ evidencia: "uploads/b.webp" }],
  });
  expect([...rutas.keys()].sort()).toEqual(["uploads/a.jpg", "uploads/b.webp"]);
  expect(rutas.get("uploads/a.jpg")).toEqual(["tblanimal.foto", "tbluser.foto"]);
});

test("urlDe codifica espacios y paréntesis", () => {
  expect(urlDe("https://srv/", "uploads/images (1).jpg")).toBe("https://srv/uploads/images%20(1).jpg");
});

test("respaldarFotos guarda las que existen y anota las que faltan", async () => {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), "fotos-"));
  const fetchImpl = jest.fn(async (url) =>
    url.includes("falta") ? { status: 404, ok: false } : { status: 200, ok: true, arrayBuffer: async () => Buffer.from("JPEG!") }
  );
  const rutas = rutasEnFilas({ t: [{ foto: "uploads/ok.jpg" }, { foto: "uploads/falta.jpg" }] });
  const r = await respaldarFotos(rutas, { base: "https://srv/", destino, fetchImpl });
  expect(r).toMatchObject({ referenciadas: 2, descargadas: 1, bytes: 5 });
  expect(r.faltantes[0]).toMatch(/uploads\/falta\.jpg.*t\.foto/);
  expect(fs.readFileSync(path.join(destino, "uploads", "ok.jpg"), "utf8")).toBe("JPEG!");
  expect(fs.readFileSync(path.join(destino, "faltantes.txt"), "utf8")).toMatch(/ya no existe en el servidor \(1\)/);
  fs.rmSync(destino, { recursive: true, force: true });
});
