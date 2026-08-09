// Respaldo manual de la base de datos: genera un .sql con la estructura y
// los datos de todas las tablas, usando las mismas variables de entorno que
// ya usa el backend para conectarse (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/
// DB_PORT). Se usa tanto localmente como desde el workflow programado de
// GitHub Actions (ver .github/workflows/backup-db.yml), porque Railway no
// ofrece respaldos automáticos en el plan gratuito.
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

function escapeVal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return v.toString();
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
  if (Buffer.isBuffer(v)) return `X'${v.toString("hex")}'`;
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const [tables] = await conn.query("SHOW TABLES");
  const tableKey = Object.keys(tables[0])[0];
  const tableNames = tables.map((t) => t[tableKey]);

  let out = `-- Respaldo de '${process.env.DB_NAME}' generado el ${new Date().toISOString()}\n`;
  out += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  let totalRows = 0;
  for (const table of tableNames) {
    const [[createRow]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    out += `-- Tabla: ${table}\nDROP TABLE IF EXISTS \`${table}\`;\n${createRow["Create Table"]};\n\n`;

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length) {
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `\`${c}\``).join(", ");
      const chunks = [];
      for (let i = 0; i < rows.length; i += 200) {
        const slice = rows.slice(i, i + 200);
        const values = slice.map((r) => `(${cols.map((c) => escapeVal(r[c])).join(", ")})`).join(",\n");
        chunks.push(`INSERT INTO \`${table}\` (${colList}) VALUES\n${values};\n`);
      }
      out += chunks.join("\n") + "\n";
      totalRows += rows.length;
    }
  }

  out += `SET FOREIGN_KEY_CHECKS=1;\n`;

  const outDir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `respaldo_${stamp}.sql`);
  fs.writeFileSync(outPath, out, "utf8");

  console.log(`Tablas: ${tableNames.length}`);
  console.log(`Filas totales: ${totalRows}`);
  console.log(`Archivo: ${outPath}`);

  await conn.end();
})().catch((e) => {
  console.error("Error generando el respaldo:", e.message);
  process.exit(1);
});
