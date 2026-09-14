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

/**
 * Envuelve un middleware de multer (`multer({...}).single("foto")`). Los
 * controladores le pasan un callback async sin try/catch: si dentro fallaba la
 * base (p. ej. rechaza un formulario incompleto) la promesa quedaba rechazada
 * sin dueño y Node cerraba el proceso, tumbando el servidor para todos. Con
 * esto ese error responde 500 y el servidor sigue.
 */
function conCaptura(subida) {
  return (req, res, callback) =>
    subida(req, res, (err) => {
      const fallar = (error) => {
        console.error("Error procesando una subida:", error);
        if (!res.headersSent) {
          res.status(500).json({ code: "001", message: "No se pudo guardar. Revisa que los datos estén completos e inténtalo de nuevo.", data: null });
        }
      };
      try {
        const resultado = callback(err);
        if (resultado && typeof resultado.catch === "function") resultado.catch(fallar);
      } catch (error) {
        fallar(error);
      }
    });
}

module.exports = { mensajeSubida, responderErrorSubida, conCaptura };
