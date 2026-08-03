const express = require("express")
const router = express.Router()
const AdoptantesController = require("../../controller/AdoptantesController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    router.post("/list",requirePermission("adopcion"),AdoptantesController.getAdoptantes)
    //router.post("/create",EgreseCotroller.createEgreso)
    router.get("/detail/:id",requirePermission("adopcion"),AdoptantesController.findByAdoptante)
    router.put("/update/:id",requirePermission("adopcion"),AdoptantesController.updateAdoptante)
    return router
}
