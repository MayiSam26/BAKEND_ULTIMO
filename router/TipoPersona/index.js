const express = require("express")
const router = express.Router()
const tipoPersonaController = require("../../controller/TipoPersonaController")

module.exports = () =>{
    router.get("/list",tipoPersonaController.getTipoPerson)
    router.post("/create",tipoPersonaController.createTipoPersona)


    return router
}