const express = require("express")
const router = express.Router()
const AuditoriaRegistrosController = require("../../controller/AuditoriaRegistrosController")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // Solo el Administrador: la auditoría muestra qué hizo cada usuario, no es
    // información que deba ver el resto del personal.
    router.post("/economica", requireRole("Administrador"), AuditoriaRegistrosController.getAuditoriaEconomica)
    return router
}
