const express = require("express")
const router = express.Router()
const AdoptantesController = require("../../controller/AdoptantesController")

module.exports = () =>{
    router.post("/list",AdoptantesController.getAdoptantes)
    //router.post("/create",EgreseCotroller.createEgreso)
    router.get("/detail/:id",AdoptantesController.findByAdoptante)
    router.put("/update/:id",AdoptantesController.updateAdoptante)
    return router
}