const express = require("express")
const router = express.Router()
const AdopcionesController = require("../../controller/AdopcionesController")
const verifyToken = require("../../middleware/auth")
const publicFormLimiter = require("../../middleware/publicFormLimiter")

module.exports = () =>{
    // pública: el sitio web la usa para que una persona postule a adoptar
    router.post("/solicitar",publicFormLimiter,AdopcionesController.solicitarAdopcion)

    // protegidas: solo el panel admin
    router.post("/list",verifyToken,AdopcionesController.getAdopciones)
    router.post("/list/reporte",verifyToken,AdopcionesController.getReporte)
    router.post("/create",verifyToken,AdopcionesController.createAdopcion)
    router.post("/create/adopciones-colitas",verifyToken,AdopcionesController.createAdopcionColitas)
    router.get("/detail/:id",verifyToken,AdopcionesController.findByIdAdopcion)
    router.put("/update/:id",verifyToken,AdopcionesController.updateAdopcion)
    return router
}