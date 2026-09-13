// Respaldo de las fotos subidas. Viven solo en el volumen de Railway
// (/app/uploads) y el respaldo semanal de la base (backup-db.js) guarda sus
// rutas pero no los archivos: si el volumen se perdiera, cada ficha quedaría
// sin su foto. Este script busca en TODAS las tablas los valores "uploads/..."
// y descarga cada archivo por la URL pública del backend a backups/fotos/.
// De paso anota en backups/fotos/faltantes.txt los registros cuya foto ya no
// existe en el servidor.
//
// Usa las mismas variables que backup-db.js (DB_HOST, DB_USER, DB_PASSWORD,
// DB_NAME, DB_PORT) y API_URL (por defecto el backend de producción).
const fs = require("fs");
const path = require("path");

const BASE_POR_DEFECTO = "https://bakendultimo-production.up.railway.app/";
const EN_PARALELO = 4;
const INTENTOS = 3;

/** "uploads\\a b.jpg" -> "uploads/a b.jpg"; null si no es una ruta de uploads segura. */
function rutaDeUpload(valor) {
  if (typeof valor !== "string") return null;
  const limpia = valor.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!limpia.startsWith("uploads/") || limpia.length <= "uploads/".length) return null;
  const partes = limpia.split("/");
  if (partes.some((p) => p === ".." || p === "." || p === "")) return null;
  return limpia;
}

/** Rutas únicas de uploads en un conjunto de filas { tabla: [fila, ...] }, con dónde aparece cada una. */
function rutasEnFilas(filasPorTabla) {
  const rutas = new Map();
  for (const [tabla, filas] of Object.entries(filasPorTabla)) {
    for (const fila of filas) {
      for (const [columna, valor] of Object.entries(fila)) {
        const ruta = rutaDeUpload(valor);
        if (!ruta) continue;
        if (!rutas.has(ruta)) rutas.set(ruta, []);
        rutas.get(ruta).push(`${tabla}.${columna}`);
      }
    }
  }
  return rutas;
}

const urlDe = (base, ruta) => base.replace(/\/?$/, "/") + ruta.split("/").map(encodeURIComponent).join("/");

async function descargar(url, { fetchImpl = fetch } = {}) {
  let ultimo;
  for (let i = 1; i <= INTENTOS; i++) {
    try {
      const r = await fetchImpl(url, { signal: AbortSignal.timeout(60000) });
      if (r.status === 404) return { status: 404 };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { status: 200, datos: Buffer.from(await r.arrayBuffer()) };
    } catch (e) {
      ultimo = e;
      await new Promise((ok) => setTimeout(ok, 1000 * i));
    }
  }
  return { status: 0, error: ultimo ? ultimo.message : "sin respuesta" };
}

/** Descarga las rutas a `destino` conservando la carpeta uploads/. */
async function respaldarFotos(rutas, { base = BASE_POR_DEFECTO, destino, fetchImpl = fetch } = {}) {
  const lista = [...rutas.keys()];
  const resultado = { referenciadas: lista.length, descargadas: 0, bytes: 0, faltantes: [], errores: [] };
  for (let i = 0; i < lista.length; i += EN_PARALELO) {
    await Promise.all(
      lista.slice(i, i + EN_PARALELO).map(async (ruta) => {
        const r = await descargar(urlDe(base, ruta), { fetchImpl });
        if (r.status === 200) {
          const archivo = path.join(destino, ...ruta.split("/"));
          fs.mkdirSync(path.dirname(archivo), { recursive: true });
          fs.writeFileSync(archivo, r.datos);
          resultado.descargadas++;
          resultado.bytes += r.datos.length;
        } else if (r.status === 404) {
          resultado.faltantes.push(`${ruta}  (usada en ${rutas.get(ruta).join(", ")})`);
        } else {
          resultado.errores.push(`${ruta}  (${r.error})`);
        }
      })
    );
  }
  fs.mkdirSync(destino, { recursive: true });
  const informe = [
    `Respaldo de fotos ${new Date().toISOString()}`,
    `Referenciadas en la base: ${resultado.referenciadas}`,
    `Descargadas: ${resultado.descargadas} (${(resultado.bytes / 1048576).toFixed(2)} MB)`,
    "",
    `Registros cuya foto ya no existe en el servidor (${resultado.faltantes.length}):`,
    ...resultado.faltantes,
    "",
    `No se pudieron descargar por error de red (${resultado.errores.length}):`,
    ...resultado.errores,
  ].join("\n");
  fs.writeFileSync(path.join(destino, "faltantes.txt"), informe + "\n", "utf8");
  return resultado;
}

async function principal() {
  const mysql = require("mysql2/promise");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  const [tablas] = await conn.query("SHOW TABLES");
  const clave = Object.keys(tablas[0])[0];
  const filasPorTabla = {};
  for (const t of tablas.map((x) => x[clave])) {
    const [filas] = await conn.query(`SELECT * FROM \`${t}\``);
    filasPorTabla[t] = filas;
  }
  await conn.end();

  const rutas = rutasEnFilas(filasPorTabla);
  const destino = path.join(__dirname, "..", "backups", "fotos");
  const r = await respaldarFotos(rutas, { base: process.env.API_URL || BASE_POR_DEFECTO, destino });
  console.log(`Fotos referenciadas: ${r.referenciadas}`);
  console.log(`Descargadas: ${r.descargadas} (${(r.bytes / 1048576).toFixed(2)} MB)`);
  console.log(`Faltan en el servidor: ${r.faltantes.length}`);
  r.faltantes.forEach((f) => console.log(`  - ${f}`));
  console.log(`Errores de red: ${r.errores.length}`);
  // Si no bajó ninguna habiendo varias, algo va mal con el servidor: que el paso salga en rojo.
  if (r.referenciadas > 0 && r.descargadas === 0) process.exit(1);
}

if (require.main === module) {
  principal().catch((e) => {
    console.error("Error respaldando fotos:", e.message);
    process.exit(1);
  });
}

module.exports = { rutaDeUpload, rutasEnFilas, respaldarFotos, urlDe };
