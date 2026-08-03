const tblpermiso = require("../Entity/Permiso");

// Igual que requireRole, pero en vez de una lista de roles fija por ruta,
// consulta tblpermiso (configurable por el Administrador desde el panel de
// Permisos) para decidir si el rol del usuario puede acceder a esta sección.
// Administrador siempre pasa. Tokens sin "rol" (sesiones viejas) también
// pasan, mismo criterio fail-open que requireRole. Si no existe una fila
// para {rol, seccion} se permite por defecto, igual que hoy se comportan
// las secciones sin restricción explícita en Navar.tsx.
module.exports = function requirePermission(seccion) {
  return async function (req, res, next) {
    const rol = req.user && req.user.rol;
    if (!rol) return next();
    if (rol === "Administrador") return next();

    try {
      const permiso = await tblpermiso.findOne({ where: { rol, seccion } });
      if (!permiso || permiso.visible) return next();
      return res.status(403).json({
        code: "001",
        message: "No tienes permisos para acceder a esta función.",
        data: null,
      });
    } catch (error) {
      console.error("Error en requirePermission:", error);
      return next();
    }
  };
};
