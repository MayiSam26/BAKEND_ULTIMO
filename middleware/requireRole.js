// Filtra el acceso según el rol del usuario autenticado (CU02: "concede el
// acceso... de acuerdo con el rol del usuario"). Los tokens emitidos antes de
// que existiera el campo "rol" no lo traen en el payload; en ese caso se deja
// pasar como si fuera Administrador para no dejar afuera a las sesiones ya
// activas al momento del despliegue.
module.exports = function requireRole(...rolesPermitidos) {
  return function (req, res, next) {
    const rol = req.user && req.user.rol;
    if (!rol) return next();
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        code: "001",
        message: "No tienes permisos para acceder a esta función.",
        data: null,
      });
    }
    next();
  };
};
