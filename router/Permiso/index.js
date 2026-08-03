const express = require("express")
const router = express.Router()
const PermisoController = require("../../controller/PermisoController")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // cualquier usuario autenticado puede consultar sus propios permisos (lo usa Navar.tsx)
    router.get("/mios", PermisoController.getMisPermisos)

    // solo Administrador puede ver/editar la matriz completa
    router.get("/list", requireRole("Administrador"), PermisoController.getPermisos)
    router.put("/update", requireRole("Administrador"), PermisoController.updatePermisos)

    return router
}
