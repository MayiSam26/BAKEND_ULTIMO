const jwt = require("jsonwebtoken");

// Como verifyToken, pero sin token (o con uno vencido) la petición sigue
// igual, solo que sin req.user. Sirve para rutas que también se usan antes de
// iniciar sesión, como el aviso de fallos de la app.
module.exports = function tokenOpcional(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (!err && decoded && !decoded.purpose) req.user = decoded;
    next();
  });
};
