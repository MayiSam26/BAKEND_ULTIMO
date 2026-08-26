const express = require("express")
const router = express.Router()
const GeneralController = require("../controller/GeneralController")
const userController = require("../controller/UserController")
const homeController = require("../controller/HomeController")
const UploadController = require("../controller/UploadController")
const AuditoriaController = require("../controller/AuditoriaController")
const verifyToken = require("../middleware/auth")
const requireRole = require("../middleware/requireRole")
const requirePermission = require("../middleware/requirePermission")
const loginLimiter = require("../middleware/loginLimiter")
const recoveryLimiter = require("../middleware/recoveryLimiter")
const publicFormLimiter = require("../middleware/publicFormLimiter")
module.exports = () =>{
    router.get("/",GeneralController.init)

    //login: público. Gestión de usuarios (CU17/CU18): solo Administrador
    router.post("/create-user",verifyToken,requireRole("Administrador"),userController.createUser)
    router.put("/usuario/update/:id",verifyToken,requireRole("Administrador"),userController.updateUser)
    router.put("/usuario/estado/:id",verifyToken,requireRole("Administrador"),userController.setUsuarioEstado)
    router.put("/usuario/password/:id",verifyToken,requireRole("Administrador"),userController.changePasswordAdmin)
    router.post("/session-user",loginLimiter,userController.sessionUser)

    //recuperar contraseña (público, con pregunta secreta)
    router.post("/usuario/pregunta",verifyToken,userController.setPreguntaSecreta)
    router.post("/recuperar/pregunta",publicFormLimiter,userController.obtenerPregunta)
    router.post("/recuperar/verificar",recoveryLimiter,userController.verificarRespuesta)
    router.post("/recuperar/reset",recoveryLimiter,userController.resetPassword)

    //usuarios (protegido, solo Administrador)
    router.get("/usuario/list",verifyToken,requireRole("Administrador"),userController.getUsuarios)
    router.post("/usuario/foto",verifyToken,userController.subirFoto)

    //admin pages (sección "refugio", acceso configurable)
    router.get("/home/list",verifyToken,requirePermission("refugio"),homeController.getHome)
    router.get("/home/:id",verifyToken,requirePermission("refugio"),homeController.getHomeById)
    router.put("/home/updates/:id",verifyToken,requirePermission("refugio"),homeController.updateHomeById)

    //upload Img
    router.post("/upload/file",verifyToken,UploadController.saveFile)

    //auditoria: cronometro del indicador "Tiempo de Registro"
    router.post("/auditoria",verifyToken,AuditoriaController.iniciarMedicion)
    router.put("/auditoria/update/:id",verifyToken,AuditoriaController.finalizarMedicion)
    router.post("/auditoria/reporte",verifyToken,requirePermission("reportes"),AuditoriaController.getReporteTiempos)


    return router
}