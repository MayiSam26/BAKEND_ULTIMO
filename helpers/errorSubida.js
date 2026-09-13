const multer = require("multer");

// Mensaje legible cuando multer rechaza una imagen. Antes dos rutas
// (actualizar colita y canal de donación) respondían { error, details } sin
// "message", y la app solo podía decir "El servidor tuvo un problema".
function mensajeSubida(err) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return "La imagen pesa más de 5 MB. Elige una más liviana.";
    return "No se pudo recibir la imagen. Intenta de nuevo.";
  }
  return (err && err.message) || "No se pudo recibir la imagen. Intenta de nuevo.";
}

function responderErrorSubida(res, err) {
  return res.status(400).json({ code: "001", message: mensajeSubida(err), data: null });
}

module.exports = { mensajeSubida, responderErrorSubida };
