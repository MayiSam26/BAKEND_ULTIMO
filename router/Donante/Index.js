const express = require("express")
const router = express.Router()
const DonanteController = require("../../controller/DonanteController")

module.exports = () =>{
    router.get("/list",DonanteController.getDonante)
    router.post("/create",DonanteController.createDonante)
    router.get("/detail/:id",DonanteController.findByidEgreso)
    router.put("/update/:id",DonanteController.updateEgreso)
    return router
}