const express = require("express")
const router = express.Router()
const ColitasController = require("../../controller/ColitasController")

module.exports = () =>{
    router.post("/list",ColitasController.getColitas)
    router.post("/create",ColitasController.createColitas)
    router.get("/detail/:id",ColitasController.findByIcolitas)
    router.put("/update/:id",ColitasController.updateColitas)
    return router
}