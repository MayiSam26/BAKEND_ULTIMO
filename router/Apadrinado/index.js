const express = require("express")
const router = express.Router()
const ApadrinadoController = require("../../controller/ApadrinadoController")

module.exports = () =>{
    router.get("/list",ApadrinadoController.getApadrinado)
    router.post("/create",ApadrinadoController.createApadrinado)
    router.get("/detail/:id",ApadrinadoController.detailApadrinado)
    router.put("/update/:id",ApadrinadoController.updateApadrinado)
    return router
}