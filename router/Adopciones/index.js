const express = require("express")
const router = express.Router()
const AdopcionesController = require("../../controller/AdopcionesController")

module.exports = () =>{
    router.post("/list",AdopcionesController.getAdopciones)
    router.post("/list/reporte",AdopcionesController.getReporte)
    router.post("/create",AdopcionesController.createAdopcion)
    router.post("/create/adopciones-colitas",AdopcionesController.createAdopcionColitas)
    router.get("/detail/:id",AdopcionesController.findByIdAdopcion)
    router.put("/update/:id",AdopcionesController.updateAdopcion)
    return router
}