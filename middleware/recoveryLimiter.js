const rateLimit = require("express-rate-limit");

// Más estricto que el limiter genérico de formularios: adivinar una
// respuesta secreta se beneficia de menos intentos permitidos.
module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por IP en esa ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: '001', message: 'Demasiados intentos, intenta de nuevo en unos minutos.', data: null }
});
