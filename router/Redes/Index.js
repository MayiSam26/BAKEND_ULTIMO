const express = require("express")
const router = express.Router()
const redesController = require("../../controller/RedesController")

module.exports = () =>{
    router.get("/list",redesController.getRedesSocial)
    router.post("/create",redesController.getCreate)
    router.get("/detail/:id",redesController.getRedesSocialById)
    router.put("/update/:id",redesController.updateRedesSocial)
    return router
}