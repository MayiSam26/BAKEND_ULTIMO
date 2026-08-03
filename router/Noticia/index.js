const express = require("express")
const router = express.Router()
const NoticiaController = require("../../controller/NoticiaController")
const verifyToken = require("../../middleware/auth")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () => {
    // pública: la usa el sitio web para mostrar las noticias publicadas
    router.get("/publicas", NoticiaController.getNoticiasPublicas)

    // protegidas: solo el panel admin, acceso configurable (sección "refugio")
    router.post("/list", verifyToken, requirePermission("refugio"), NoticiaController.getNoticias)
    router.post("/create", verifyToken, requirePermission("refugio"), NoticiaController.createNoticia)
    router.get("/detail/:id", verifyToken, requirePermission("refugio"), NoticiaController.findByIdNoticia)
    router.put("/update/:id", verifyToken, requirePermission("refugio"), NoticiaController.updateNoticia)
    router.delete("/delete/:id", verifyToken, requirePermission("refugio"), NoticiaController.deleteNoticia)
    return router
}
