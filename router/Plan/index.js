const express = require("express")
const router = express.Router()
const PlanController = require("../../controller/PlanMensualController")
module.exports = () =>{
    router.get("/list",PlanController.getPlanMensual)
    router.post("/create",PlanController.createPlanMensual)
    router.post("/update/:id",PlanController.updatePlanMensual)
    router.get("/detail/:id",PlanController.getDetailPlan)
    router.post("/remove/:id",PlanController.deletPlanById)
    //crear user
    //router.post("/list",userController.createUser)
    


    return router
}