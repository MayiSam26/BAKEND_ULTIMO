const express = require("express")
const router = express.Router()
const redesController = require("../../controller/RedesController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    router.get("/list",requirePermission("refugio"),redesController.getRedesSocial)
    router.post("/create",requirePermission("refugio"),redesController.getCreate)
    router.get("/detail/:id",requirePermission("refugio"),redesController.getRedesSocialById)
    router.put("/update/:id",requirePermission("refugio"),redesController.updateRedesSocial)
    return router
}
