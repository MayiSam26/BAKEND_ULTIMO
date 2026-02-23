const express = require("express")
const router = express.Router()
const IngresoController = require("../../controller/IngresoController")

module.exports = () =>{
    router.get("/list",IngresoController.getIngresos)
    router.post("/reporte",IngresoController.getReporte)
    router.post("/create",IngresoController.createIngreso)
    ///router.get("/detail/:id",EgreseCotroller.findByidEgreso)
    ///router.put("/update/:id",EgreseCotroller.updateEgreso)
    return router
}