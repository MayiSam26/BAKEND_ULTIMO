const express = require("express")
const router = express.Router()
const perdidosController = require("../../controller/PerdidosController")
module.exports = () =>{
    router.post("/list",perdidosController.getPerdidos)
    router.post("/create",perdidosController.createPerdidos)
    router.get("/recientes",perdidosController.getPerdidosTopfour)
    router.get("/detail/:id",perdidosController.getDetail)
    //router.put("/update/:id",PlanController.updatePlanMensual)
    //router.get("/detail/:id",PlanController.getDetailPlan)
    //crear user
    //router.post("/list",userController.createUser)
    


    return router
}