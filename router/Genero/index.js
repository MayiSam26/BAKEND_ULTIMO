const express = require("express")
const router = express.Router()
const generoController = require("../../controller/GeneroControler")
const requireRole = require("../../middleware/requireRole")

module.exports = () =>{
    router.get("/list",generoController.getGenero)
    // Catálogo interno: alimenta desplegables, no lo edita ninguna pantalla.
    // Se restringe a Administrador para que ningún otro rol pueda ensuciarlo.
    router.post("/create",requireRole("Administrador"),generoController.createGenero)


    return router
}
