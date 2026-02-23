const express = require("express")
const router = express.Router()
const EgreseCotroller = require("../../controller/EgreseCotroller")

module.exports = () =>{
    router.get("/list",EgreseCotroller.findAllEgreso)
    router.post("/create",EgreseCotroller.createEgreso)
    router.get("/detail/:id",EgreseCotroller.findByidEgreso)
    router.put("/update/:id",EgreseCotroller.updateEgreso)
    return router
}