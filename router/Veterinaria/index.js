const express = require("express")
const router = express.Router()
const VeterinariaController = require("../../controller/VeterinariaController")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // CU21: registrar información veterinaria - exclusivo de Veterinario y Administrador
    router.post("/list", requireRole("Administrador", "Veterinario"), VeterinariaController.getRegistros)
    router.post("/reporte", requireRole("Administrador", "Veterinario"), VeterinariaController.getReporte)
    router.post("/create", requireRole("Administrador", "Veterinario"), VeterinariaController.createRegistro)
    router.get("/detail/:id", requireRole("Administrador", "Veterinario"), VeterinariaController.findByIdRegistro)
    router.put("/update/:id", requireRole("Administrador", "Veterinario"), VeterinariaController.updateRegistro)
    router.delete("/delete/:id", requireRole("Administrador", "Veterinario"), VeterinariaController.deleteRegistro)
    return router
}
