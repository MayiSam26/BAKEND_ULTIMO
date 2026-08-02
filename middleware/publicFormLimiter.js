const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 8, // 8 solicitudes por IP en esa ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: '001', message: 'Demasiadas solicitudes, intenta de nuevo en unos minutos.', data: null }
});
