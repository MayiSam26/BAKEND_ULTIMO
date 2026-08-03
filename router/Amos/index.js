const express = require("express")
const router = express.Router()
const duenoController = require("../../controller/DuenoController")
const requirePermission = require("../../middleware/requirePermission")
module.exports = () =>{
    router.post("/list",requirePermission("perdidos"),duenoController.getDueno)
    router.post("/create",requirePermission("perdidos"),duenoController.createAmo)
    router.put("/update/:id",requirePermission("perdidos"),duenoController.updateApoderado)
    router.get("/detail/:id",requirePermission("perdidos"),duenoController.getDetailApoderado)
    router.delete("/delete/:id",requirePermission("perdidos"),duenoController.deleteApoderado)
    //crear user
    //router.post("/list",userController.createUser)



    return router
}
