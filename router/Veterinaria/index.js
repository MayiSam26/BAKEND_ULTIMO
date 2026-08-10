const express = require("express")
const router = express.Router()
const VeterinariaController = require("../../controller/VeterinariaController")
const requirePermission = require("../../middleware/requirePermission")

module.exports = () => {
    // CU21: registrar información veterinaria - acceso configurable desde el panel de Permisos
    router.post("/list", requirePermission("veterinaria"), VeterinariaController.getRegistros)
    router.post("/reporte", requirePermission("veterinaria"), VeterinariaController.getReporte)
    router.post("/create", requirePermission("veterinaria"), VeterinariaController.createRegistro)
    router.get("/detail/:id", requirePermission("veterinaria"), VeterinariaController.findByIdRegistro)
    router.put("/update/:id", requirePermission("veterinaria"), VeterinariaController.updateRegistro)
    router.put("/estado/:id", requirePermission("veterinaria"), VeterinariaController.setEstado)
    router.delete("/delete/:id", requirePermission("veterinaria"), VeterinariaController.deleteRegistro)
    return router
}
