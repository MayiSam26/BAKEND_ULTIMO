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
        req.user = decoded;
        next();
    });
};
