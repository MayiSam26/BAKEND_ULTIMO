const express = require("express")
const router = express.Router()
const ColitasController = require("../../controller/ColitasController")
const verifyToken = require("../../middleware/auth")

module.exports = () =>{
    // públicas: las usa el sitio público para mostrar mascotas en adopción
    router.post("/list",ColitasController.getColitas)
    router.get("/detail/:id",ColitasController.findByIcolitas)

    // protegidas: solo el panel admin puede crear/editar
    router.post("/create",verifyToken,ColitasController.createColitas)
    router.put("/update/:id",verifyToken,ColitasController.updateColitas)
    return router
}