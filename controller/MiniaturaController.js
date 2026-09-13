const fs = require("fs");
const path = require("path");

// Miniaturas de las fotos subidas, para la app móvil. Las fotos se guardan
// tal cual llegan (hay de más de 2 MB) y una lista con veinte de ellas pesa
// demasiado en datos móviles. La app pide /miniatura/uploads/<archivo>?w=320
// y recibe un WebP de ese ancho; la primera vez se genera y queda en disco,
// las siguientes se sirve desde ahí.
//
// Solo se aceptan unos pocos anchos: si cualquier número valiera, alguien
// podría llenar el disco pidiendo la misma foto a mil tamaños distintos.

const ANCHOS = [160, 320, 640, 1080];
const ANCHO_DEFECTO = 320;
const CARPETA_FOTOS = path.join(__dirname, "..", "uploads");
const CARPETA_CACHE = path.join(__dirname, "..", "cache", "miniaturas");

let sharp = null;
try {
  sharp = require("sharp");
} catch (error) {
  // Sin sharp (binario que no cargó en el servidor) se sirve la foto
  // original: la app se ve igual, solo que pesa más.
  console.error("sharp no disponible, las miniaturas devolverán la foto original:", error.message);
}

/**
 * Nombre de archivo que no sale de uploads/. No se filtra por caracteres: la
 * subida conserva el nombre original y ya hay fotos como "peluchin}.jpeg".
 * Lo que importa es que no traiga rutas, y eso se comprueba resolviéndolo.
 */
function archivoValido(nombre) {
  return (
    typeof nombre === "string" &&
    nombre.length > 0 &&
    nombre.length <= 255 &&
    !nombre.startsWith(".") &&
    !/[\/\\\0]/.test(nombre) &&
    path.dirname(path.resolve(CARPETA_FOTOS, nombre)) === path.resolve(CARPETA_FOTOS)
  );
}

function anchoPedido(valor) {
  const n = Number(valor);
  return ANCHOS.includes(n) ? n : ANCHO_DEFECTO;
}

exports.getMiniatura = async (req, res) => {
  const { archivo } = req.params;
  if (!archivoValido(archivo)) {
    return res.status(400).json({ code: "001", message: "Nombre de archivo no válido", data: null });
  }

  const original = path.join(CARPETA_FOTOS, archivo);
  if (!fs.existsSync(original)) {
    return res.status(404).json({ code: "001", message: "La foto no existe", data: null });
  }

  // El nombre lleva la marca de tiempo de la subida, así que una foto nueva
  // es siempre un archivo nuevo: se puede cachear sin miedo a quedar vieja.
  res.setHeader("Cache-Control", "public, max-age=2592000, immutable");

  if (!sharp) return res.sendFile(original);

  const ancho = anchoPedido(req.query.w);
  const destino = path.join(CARPETA_CACHE, String(ancho), archivo + ".webp");

  try {
    if (!fs.existsSync(destino)) {
      await fs.promises.mkdir(path.dirname(destino), { recursive: true });
      // Se escribe a un temporal y se renombra: dos peticiones a la vez nunca
      // ven una miniatura a medio escribir.
      const temporal = destino + "." + process.pid + "." + Date.now() + ".tmp";
      await sharp(original)
        .rotate() // respeta la orientación EXIF de las fotos hechas con el móvil
        .resize({ width: ancho, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(temporal);
      await fs.promises.rename(temporal, destino);
    }
    res.type("image/webp");
    return res.sendFile(destino);
  } catch (error) {
    console.error("Error generando miniatura de", archivo, error.message);
    return res.sendFile(original);
  }
};

exports.ANCHOS = ANCHOS;
exports.archivoValido = archivoValido;
exports.anchoPedido = anchoPedido;
