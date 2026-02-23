const express = require("express")
const router = express.Router()
const GeneralController = require("../controller/GeneralController")
const userController = require("../controller/UserController")
const sendMailController = require("../controller/SendMailController")
const homeController = require("../controller/HomeController")
const UploadController = require("../controller/UploadController")
const AuditoriaController = require("../controller/AuditoriaController")
module.exports = () =>{
    router.get("/",GeneralController.init)

    //crear user
    router.post("/create-user",userController.createUser)
    router.post("/session-user",userController.sessionUser)

    router.post("/send-mail",sendMailController.sendMailGamail)

    //admin pages
    router.get("/home/list",homeController.getHome)
    router.get("/home/:id",homeController.getHomeById)
    router.put("/home/updates/:id",homeController.updateHomeById)

    //upload Img
    router.post("/upload/file",UploadController.saveFile)

    //auditoria
    router.post("/auditoria",AuditoriaController.createAuditoria)
    router.put("/auditoria/update/:id",AuditoriaController.updateAuditoria)


    return router
}