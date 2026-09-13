const express = require("express");
const router = express.Router();
const PushController = require("../../controller/PushController");

module.exports = function () {
  // Cualquier usuario con sesión puede activar o quitar su propio teléfono.
  router.post("/registrar", PushController.registrar);
  router.post("/quitar", PushController.quitar);
  router.post("/prueba", (req, res) => PushController.probar(req, res));
  return router;
};
