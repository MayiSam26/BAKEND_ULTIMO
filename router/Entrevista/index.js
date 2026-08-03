const express = require("express")
const router = express.Router()
const EntrevistaController = require("../../controller/EntrevistaController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () => {
    router.post("/list", requirePermission("adopcion"), EntrevistaController.getEntrevistas)
    router.post("/reporte", requirePermission("adopcion"), EntrevistaController.getReporte)
    router.post("/create", requirePermission("adopcion"), EntrevistaController.createEntrevista)
    router.get("/detail/:id", requirePermission("adopcion"), EntrevistaController.findByIdEntrevista)
    router.put("/update/:id", requirePermission("adopcion"), EntrevistaController.updateEntrevista)
    return router
}
