const express = require("express")
const router = express.Router()
const generoController = require("../../controller/GeneroControler")

module.exports = () =>{
    router.get("/list",generoController.getGenero)
    router.post("/create",generoController.createGenero)


    return router
}