const express = require("express")
const router = express.Router()
const EgreseCotroller = require("../../controller/EgreseCotroller")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () =>{
    router.get("/list",requirePermission("donaciones"),EgreseCotroller.findAllEgreso)
    router.post("/create",requirePermission("donaciones"),EgreseCotroller.createEgreso)
    router.get("/detail/:id",requirePermission("donaciones"),EgreseCotroller.findByidEgreso)
    router.put("/update/:id",requirePermission("donaciones"),EgreseCotroller.updateEgreso)
    return router
}