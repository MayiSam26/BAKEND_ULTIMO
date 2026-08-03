const express = require("express")
const router = express.Router()
const EntrevistaController = require("../../controller/EntrevistaController")

module.exports = () => {
    router.post("/list", EntrevistaController.getEntrevistas)
    router.post("/reporte", EntrevistaController.getReporte)
    router.post("/create", EntrevistaController.createEntrevista)
    router.get("/detail/:id", EntrevistaController.findByIdEntrevista)
    router.put("/update/:id", EntrevistaController.updateEntrevista)
    return router
}
