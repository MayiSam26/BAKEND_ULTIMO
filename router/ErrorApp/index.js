const express = require("express");
const router = express.Router();
const ErrorAppController = require("../../controller/ErrorAppController");
const verifyToken = require("../../middleware/auth");
const tokenOpcional = require("../../middleware/tokenOpcional");
const requireRole = require("../../middleware/requireRole");
const appErrorLimiter = require("../../middleware/appErrorLimiter");

module.exports = function () {
  // La app manda sus fallos también antes de iniciar sesión.
  router.post("/", appErrorLimiter, tokenOpcional, ErrorAppController.registrar);
  router.get("/list", verifyToken, requireRole("Administrador"), ErrorAppController.listar);
  router.delete("/", verifyToken, requireRole("Administrador"), ErrorAppController.vaciar);
  return router;
};
