const express = require("express")
const router = express.Router()
const perdidosController = require("../../controller/PerdidosController")
module.exports = () =>{
    router.post("/list",perdidosController.getPerdidos)
    router.post("/create",perdidosController.createPerdidos)
    router.get("/recientes",perdidosController.getPerdidosTopfour)
    router.get("/detail/:id",perdidosController.getDetail)
    router.put("/update/:id",perdidosController.updatePerdidos)
    router.delete("/delete/:id",perdidosController.deletePerdidos)

    return router
}
