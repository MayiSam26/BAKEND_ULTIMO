const jwt = require("jsonwebtoken");
const { estadoUsuario, motivoRechazo } = require("../helpers/estadoUsuario");

module.exports = function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ code: '001', message: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ code: '001', message: 'Token inválido o expirado' });
        }
        // Un token con propósito (recuperar contraseña, renovar la sesión de la
        // app) solo sirve para esa operación puntual, no como token de sesión.
        if (decoded.purpose) {
            return res.status(401).json({ code: '001', message: 'Token no válido para esta operación' });
        }

        // El token vale 4 h: se contrasta con la cuenta tal como está ahora
        // (desactivada, rol o contraseña cambiados). La app renueva sola con
        // su token de renovación; el panel vuelve al login.
        if (decoded.iduser != null) {
            try {
                const motivo = motivoRechazo(decoded, await estadoUsuario(decoded.iduser));
                if (motivo) return res.status(401).json({ code: '001', message: motivo });
            } catch (error) {
                // Si la base no responde no se deja a nadie fuera (mismo
                // criterio que requirePermission); la petición fallará igual
                // más adelante si de verdad no hay base.
                console.error("No se pudo comprobar el estado del usuario:", error.message);
            }
        }

        req.user = decoded;
        next();
    });
};
