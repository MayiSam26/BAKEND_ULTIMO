const express = require("express")
const router = express.Router()
const NoticiaController = require("../../controller/NoticiaController")
const verifyToken = require("../../middleware/auth")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // pública: la usa el sitio web para mostrar las noticias publicadas
    router.get("/publicas", NoticiaController.getNoticiasPublicas)

    // protegidas: solo el panel admin, y solo rol Administrador (CU19)
    router.post("/list", verifyToken, requireRole("Administrador"), NoticiaController.getNoticias)
    router.post("/create", verifyToken, requireRole("Administrador"), NoticiaController.createNoticia)
    router.get("/detail/:id", verifyToken, requireRole("Administrador"), NoticiaController.findByIdNoticia)
    router.put("/update/:id", verifyToken, requireRole("Administrador"), NoticiaController.updateNoticia)
    router.delete("/delete/:id", verifyToken, requireRole("Administrador"), NoticiaController.deleteNoticia)
    return router
}
