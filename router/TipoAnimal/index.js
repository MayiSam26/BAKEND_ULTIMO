const express = require("express")
const router = express.Router()
const tipoAnimalController = require("../../controller/TipoAnimalController")

module.exports = () =>{
    router.get("/list",tipoAnimalController.getTipoAnimal)
    return router
}