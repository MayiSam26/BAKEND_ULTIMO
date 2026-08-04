const express = require("express")
const router = express.Router()
const apadrinadoController = require("../../controller/ApadrinadoController")
const verifyToken = require("../../middleware/auth")
const requirePermission = require("../../middleware/requirePermission")
module.exports = () =>{
    // protegidas: solo el panel admin, sección "donaciones" (acceso configurable)
    router.post("/list",verifyToken,requirePermission("donaciones"),apadrinadoController.getApadrinados)
    router.post("/create",verifyToken,requirePermission("donaciones"),apadrinadoController.createApadrinado)
    router.get("/detail/:id",verifyToken,requirePermission("donaciones"),apadrinadoController.getDetail)
    router.put("/update/:id",verifyToken,requirePermission("donaciones"),apadrinadoController.updateApadrinado)
    router.delete("/delete/:id",verifyToken,requirePermission("donaciones"),apadrinadoController.deleteApadrinado)

    return router
}
