const rateLimit = require("express-rate-limit");

// La ruta de fallos acepta peticiones sin sesión: se limita para que nadie
// pueda llenar la tabla. Cada envío trae como mucho 20 fallos.
module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 envíos por IP en esa ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: '001', message: 'Demasiados envíos, intenta más tarde.', data: null }
});
