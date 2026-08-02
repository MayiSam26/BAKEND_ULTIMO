const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por IP en esa ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: '001', message: 'Demasiados intentos, intenta de nuevo en unos minutos.', data: null }
});
