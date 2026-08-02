const express = require("express")
const router = express.Router()
const GeneralController = require("../controller/GeneralController")
const userController = require("../controller/UserController")
const homeController = require("../controller/HomeController")
const UploadController = require("../controller/UploadController")
const AuditoriaController = require("../controller/AuditoriaController")
const verifyToken = require("../middleware/auth")
module.exports = () =>{
    router.get("/",GeneralController.init)

    //login: público. crear usuario: solo un admin ya logueado puede crear otro
    router.post("/create-user",verifyToken,userController.createUser)
    router.post("/session-user",userController.sessionUser)

    //admin pages
    router.get("/home/list",verifyToken,homeController.getHome)
    router.get("/home/:id",verifyToken,homeController.getHomeById)
    router.put("/home/updates/:id",verifyToken,homeController.updateHomeById)

    //upload Img
    router.post("/upload/file",verifyToken,UploadController.saveFile)

    //auditoria
    router.post("/auditoria",verifyToken,AuditoriaController.createAuditoria)
    router.put("/auditoria/update/:id",verifyToken,AuditoriaController.updateAuditoria)


    return router
}