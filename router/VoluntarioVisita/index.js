const express = require("express")
const router = express.Router()
const VoluntarioVisitaController = require("../../controller/VoluntarioVisitaController")
const requireRole = require("../../middleware/requireRole")

module.exports = () => {
    // list: la llama el calendario "Mis Visitas" del inicio, así que cualquier
    // usuario autenticado puede pedirla; el controller fuerza el filtro a sus
    // propias visitas si no es Administrador. Antes pasaba por
    // requirePermission("voluntariado"), una sección que nunca existió en el
    // panel de Permisos: solo funcionaba porque ese middleware permite pasar
    // cuando no encuentra la fila. Si alguien llegaba a crearla en "oculto",
    // el calendario del Voluntario se quedaba vacío sin explicación.
    router.post("/list", VoluntarioVisitaController.getVisitas)
    // Asignar/editar/eliminar visitas es solo del Administrador.
    router.post("/create", requireRole("Administrador"), VoluntarioVisitaController.createVisita)
    router.put("/update/:id", requireRole("Administrador"), VoluntarioVisitaController.updateVisita)
    // Marcar como realizada: el Administrador cualquiera, el voluntario solo
    // las suyas (lo verifica el controller).
    router.put("/estado/:id", VoluntarioVisitaController.setEstado)
    router.delete("/delete/:id", requireRole("Administrador"), VoluntarioVisitaController.deleteVisita)
    return router
}
