const express = require("express")
const router = express.Router()
const GeneralController = require("../controller/GeneralController")
const userController = require("../controller/UserController")
const homeController = require("../controller/HomeController")
const UploadController = require("../controller/UploadController")
const AuditoriaController = require("../controller/AuditoriaController")
const verifyToken = require("../middleware/auth")
const loginLimiter = require("../middleware/loginLimiter")
const recoveryLimiter = require("../middleware/recoveryLimiter")
const publicFormLimiter = require("../middleware/publicFormLimiter")
module.exports = () =>{
    router.get("/",GeneralController.init)

    //login: público. crear usuario: solo un admin ya logueado puede crear otro
    router.post("/create-user",verifyToken,userController.createUser)
    router.post("/session-user",loginLimiter,userController.sessionUser)

    //recuperar contraseña (público, con pregunta secreta)
    router.post("/usuario/pregunta",verifyToken,userController.setPreguntaSecreta)
    router.post("/recuperar/pregunta",publicFormLimiter,userController.obtenerPregunta)
    router.post("/recuperar/verificar",recoveryLimiter,userController.verificarRespuesta)
    router.post("/recuperar/reset",recoveryLimiter,userController.resetPassword)

    //usuarios (protegido)
    router.get("/usuario/list",verifyToken,userController.getUsuarios)
    router.post("/usuario/foto",verifyToken,userController.subirFoto)

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