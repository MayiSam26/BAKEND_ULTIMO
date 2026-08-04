const express = require("express")
const router = express.Router()
const perdidosController = require("../../controller/PerdidosController")
const verifyToken = require("../../middleware/auth")
const requirePermission = require("../../middleware/requirePermission")
module.exports = () =>{
    // pública: la usa el sitio web para mostrar mascotas perdidas (RF05)
    router.get("/publicas",perdidosController.getPerdidosPublicas)

    // protegidas: solo el panel admin
    router.post("/list",verifyToken,requirePermission("perdidos"),perdidosController.getPerdidos)
    router.post("/create",verifyToken,requirePermission("perdidos"),perdidosController.createPerdidos)
    router.get("/recientes",verifyToken,requirePermission("perdidos"),perdidosController.getPerdidosTopfour)
    router.get("/detail/:id",verifyToken,requirePermission("perdidos"),perdidosController.getDetail)
    router.put("/update/:id",verifyToken,requirePermission("perdidos"),perdidosController.updatePerdidos)
    router.delete("/delete/:id",verifyToken,requirePermission("perdidos"),perdidosController.deletePerdidos)

    return router
}
