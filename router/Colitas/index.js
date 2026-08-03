const express = require("express")
const router = express.Router()
const ColitasController = require("../../controller/ColitasController")
const verifyToken = require("../../middleware/auth")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    // públicas: las usa el sitio público para mostrar mascotas en adopción
    router.post("/list",ColitasController.getColitas)
    router.get("/detail/:id",ColitasController.findByIcolitas)

    // protegidas: solo el panel admin puede crear/editar, acceso configurable
    router.post("/create",verifyToken,requirePermission("colitas"),ColitasController.createColitas)
    router.put("/update/:id",verifyToken,requirePermission("colitas"),ColitasController.updateColitas)
    return router
}