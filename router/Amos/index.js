const express = require("express")
const router = express.Router()
const duenoController = require("../../controller/DuenoController")
module.exports = () =>{
    router.post("/list",duenoController.getDueno)
    router.post("/create",duenoController.createAmo)
    router.put("/update/:id",duenoController.updateApoderado)
    router.get("/detail/:id",duenoController.getDetailApoderado)
    router.delete("/delete/:id",duenoController.deleteApoderado)
    //crear user
    //router.post("/list",userController.createUser)
    


    return router
}