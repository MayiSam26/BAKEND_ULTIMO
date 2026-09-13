const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ code: '001', message: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ code: '001', message: 'Token inválido o expirado' });
        }
        // Un token con propósito (recuperar contraseña, renovar la sesión de la
        // app) solo sirve para esa operación puntual, no como token de sesión.
        if (decoded.purpose) {
            return res.status(401).json({ code: '001', message: 'Token no válido para esta operación' });
        }
        req.user = decoded;
        next();
    });
};
