const rateLimit = require("express-rate-limit");

// Renovar la sesión es algo que la app hace sola cada pocas horas, así que el
// límite es más holgado que el del login (varios móviles pueden salir por la
// misma IP en la wifi del refugio), pero sigue frenando a quien pruebe tokens.
module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: '001', message: 'Demasiados intentos, intenta de nuevo en unos minutos.', data: null }
});
