const express = require("express")
const router = express.Router()
const DonanteController = require("../../controller/DonanteController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    router.get("/list",requirePermission("donaciones"),DonanteController.getDonante)
    router.post("/create",requirePermission("donaciones"),DonanteController.createDonante)
    router.get("/detail/:id",requirePermission("donaciones"),DonanteController.findByidEgreso)
    router.put("/update/:id",requirePermission("donaciones"),DonanteController.updateEgreso)
    return router
}
