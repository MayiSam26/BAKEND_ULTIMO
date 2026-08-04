const express = require("express")
const router = express.Router()
const contactoController = require("../../controller/ContactoController")
const publicFormLimiter = require("../../middleware/publicFormLimiter")
module.exports = () =>{
    // pública (RF06): consulta de donación desde el sitio web, se envía por correo
    router.post("/donacion",publicFormLimiter,contactoController.enviarConsultaDonacion)

    return router
}
