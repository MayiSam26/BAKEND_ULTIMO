const express = require("express")
const router = express.Router()
const SeguimientoController = require("../../controller/SeguimientoController")

module.exports = () => {
    router.post("/list", SeguimientoController.getSeguimientos)
    router.post("/reporte", SeguimientoController.getReporte)
    router.post("/create", SeguimientoController.createSeguimiento)
    router.get("/detail/:id", SeguimientoController.findByIdSeguimiento)
    router.put("/update/:id", SeguimientoController.updateSeguimiento)
    return router
}
