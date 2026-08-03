const express = require("express")
const router = express.Router()
const perdidosController = require("../../controller/PerdidosController")
const requirePermission = require("../../middleware/requirePermission")
module.exports = () =>{
    router.post("/list",requirePermission("perdidos"),perdidosController.getPerdidos)
    router.post("/create",requirePermission("perdidos"),perdidosController.createPerdidos)
    router.get("/recientes",requirePermission("perdidos"),perdidosController.getPerdidosTopfour)
    router.get("/detail/:id",requirePermission("perdidos"),perdidosController.getDetail)
    router.put("/update/:id",requirePermission("perdidos"),perdidosController.updatePerdidos)
    router.delete("/delete/:id",requirePermission("perdidos"),perdidosController.deletePerdidos)

    return router
}
