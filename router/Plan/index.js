const express = require("express")
const router = express.Router()
const PlanController = require("../../controller/PlanMensualController")
const verifyToken = require("../../middleware/auth")
module.exports = () =>{
    // pública: la usa el sitio público para mostrar los planes de apadrinamiento
    router.get("/list",PlanController.getPlanMensual)

    // protegidas: solo el panel admin
    router.post("/create",verifyToken,PlanController.createPlanMensual)
    router.post("/update/:id",verifyToken,PlanController.updatePlanMensual)
    router.get("/detail/:id",verifyToken,PlanController.getDetailPlan)
    router.post("/remove/:id",verifyToken,PlanController.deletPlanById)

    return router
}