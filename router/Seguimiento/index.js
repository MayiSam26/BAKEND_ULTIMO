const express = require("express")
const router = express.Router()
const SeguimientoController = require("../../controller/SeguimientoController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () => {
    router.post("/list", requirePermission("adopcion"), SeguimientoController.getSeguimientos)
    router.post("/reporte", requirePermission("adopcion"), SeguimientoController.getReporte)
    router.post("/create", requirePermission("adopcion"), SeguimientoController.createSeguimiento)
    router.get("/detail/:id", requirePermission("adopcion"), SeguimientoController.findByIdSeguimiento)
    router.put("/update/:id", requirePermission("adopcion"), SeguimientoController.updateSeguimiento)
    return router
}
