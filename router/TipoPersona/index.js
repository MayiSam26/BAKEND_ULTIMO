const express = require("express")
const router = express.Router()
const tipoPersonaController = require("../../controller/TipoPersonaController")
const requireRole = require("../../middleware/requireRole")

module.exports = () =>{
    router.get("/list",tipoPersonaController.getTipoPerson)
    // Catálogo interno: alimenta desplegables, no lo edita ninguna pantalla.
    // Se restringe a Administrador para que ningún otro rol pueda ensuciarlo.
    router.post("/create",requireRole("Administrador"),tipoPersonaController.createTipoPersona)


    return router
}
