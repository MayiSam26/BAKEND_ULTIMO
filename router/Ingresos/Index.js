const express = require("express")
const router = express.Router()
const IngresoController = require("../../controller/IngresoController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    router.get("/list",requirePermission("donaciones"),IngresoController.getIngresos)
    router.post("/reporte",requirePermission("donaciones"),IngresoController.getReporte)
    router.post("/create",requirePermission("donaciones"),IngresoController.createIngreso)
    ///router.get("/detail/:id",EgreseCotroller.findByidEgreso)
    ///router.put("/update/:id",EgreseCotroller.updateEgreso)
    return router
}
