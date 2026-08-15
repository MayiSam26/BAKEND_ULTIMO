const express = require("express")
const router = express.Router()
const VoluntarioVisitaController = require("../../controller/VoluntarioVisitaController")
const requirePermission = require("../../middleware/requirePermission")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // list: cualquier rol con acceso a "voluntariado" puede llamarla, pero el
    // controller fuerza el filtro a sus propias visitas si no es Administrador.
    router.post("/list", requirePermission("voluntariado"), VoluntarioVisitaController.getVisitas)
    // Asignar/editar/eliminar visitas es solo del Administrador.
    router.post("/create", requirePermission("voluntariado"), requireRole("Administrador"), VoluntarioVisitaController.createVisita)
    router.put("/update/:id", requirePermission("voluntariado"), requireRole("Administrador"), VoluntarioVisitaController.updateVisita)
    router.delete("/delete/:id", requirePermission("voluntariado"), requireRole("Administrador"), VoluntarioVisitaController.deleteVisita)
    return router
}
