const express = require("express")
const router = express.Router()
const PlanController = require("../../controller/PlanMensualController")
const verifyToken = require("../../middleware/auth")
const requireRole = require("../../middleware/requireRole")
module.exports = () =>{
    // pública: la usa el sitio público para mostrar los canales de donación
    // (Yape, Plin, PayPal) en la portada.
    router.get("/list",PlanController.getPlanMensual)

    // Solo Administrador: acá se editan los números de Yape/Plin y el enlace
    // de PayPal que ve el público. Antes bastaba con estar logueado, así que
    // cualquier rol (por ejemplo Voluntario) podía cambiar la cuenta a la que
    // llegan las donaciones.
    router.post("/create",verifyToken,requireRole("Administrador"),PlanController.createPlanMensual)
    router.post("/update/:id",verifyToken,requireRole("Administrador"),PlanController.updatePlanMensual)
    router.get("/detail/:id",verifyToken,requireRole("Administrador"),PlanController.getDetailPlan)
    router.post("/remove/:id",verifyToken,requireRole("Administrador"),PlanController.deletPlanById)

    return router
}
