const express = require("express")
const router = express.Router()
const AdopcionesController = require("../../controller/AdopcionesController")
const verifyToken = require("../../middleware/auth")
const requirePermission = require("../../middleware/requirePermission")
const publicFormLimiter = require("../../middleware/publicFormLimiter")

module.exports = () =>{
    // pública: el sitio web la usa para que una persona postule a adoptar
    router.post("/solicitar",publicFormLimiter,AdopcionesController.solicitarAdopcion)

    // protegidas: solo el panel admin, acceso configurable (sección "adopcion")
    router.post("/list",verifyToken,requirePermission("adopcion"),AdopcionesController.getAdopciones)
    router.post("/list/reporte",verifyToken,requirePermission("adopcion"),AdopcionesController.getReporte)
    router.post("/create",verifyToken,requirePermission("adopcion"),AdopcionesController.createAdopcion)
    router.post("/create/adopciones-colitas",verifyToken,requirePermission("adopcion"),AdopcionesController.createAdopcionColitas)
    router.get("/detail/:id",verifyToken,requirePermission("adopcion"),AdopcionesController.findByIdAdopcion)
    router.put("/update/:id",verifyToken,requirePermission("adopcion"),AdopcionesController.updateAdopcion)
    return router
}
