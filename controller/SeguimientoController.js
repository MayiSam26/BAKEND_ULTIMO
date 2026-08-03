const tblseguimiento = require("../Entity/Seguimiento");
const tbladopcion = require("../Entity/Adopciones");
const tbladoptante = require("../Entity/Adoptantes");
const tblColitas = require("../Entity/Colitas");
const moment = require("moment");
const multer = require("multer");
const path = require("path");
const { Op } = require("sequelize");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + path.basename(file.originalname));
  },
});
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpg, png, webp, gif)"));
    }
  },
}).single("evidencia");

exports.getSeguimientos = async (req, res, next) => {
  try {
    const { estado, idadopcion } = req.body || {};
    const filters = {};
    if (estado) filters.Estado = estado;
    if (idadopcion) filters.idadopcion = idadopcion;

    const seguimientos = await tblseguimiento.findAll({
      where: filters,
      order: [["Fecha_Programada", "DESC"]],
    });

    const idsAdopcion = seguimientos.map((s) => s.idadopcion);
    const adopciones = await tbladopcion.findAll({ where: { idadopcion: { [Op.in]: idsAdopcion } } });
    const idsAdoptante = adopciones.map((a) => a.idadoptante);
    const idsAnimal = adopciones.map((a) => a.idanimal);

    const adoptantes = await tbladoptante.findAll({ where: { idadoptante: { [Op.in]: idsAdoptante } } });
    const animales = await tblColitas.findAll({ where: { idanimal: { [Op.in]: idsAnimal } } });

    const adopcionesLimpias = adopciones.map((a) => a.get());
    const adoptantesLimpios = adoptantes.map((a) => a.get());
    const animalesLimpios = animales.map((a) => a.get());

    const data = seguimientos.map((s) => {
      const adopcion = adopcionesLimpias.find((a) => a.idadopcion === s.idadopcion) || null;
      const adoptante = adopcion ? adoptantesLimpios.find((a) => a.idadoptante === adopcion.idadoptante) : null;
      const animal = adopcion ? animalesLimpios.find((a) => a.idanimal === adopcion.idanimal) : null;
      return {
        ...s.get(),
        adopcion,
        adoptante: adoptante || null,
        animal: animal || null,
      };
    });

    res.json({ code: "000", message: "success", data });
  } catch (error) {
    console.error("Error en getSeguimientos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.getReporte = async (req, res, next) => {
  try {
    const total = await tblseguimiento.count();
    const pendiente = await tblseguimiento.count({ where: { Estado: "pendiente" } });
    const realizado = await tblseguimiento.count({ where: { Estado: "realizado" } });
    res.json({ code: "000", message: "success", data: [{ total, pendiente, realizado }] });
  } catch (error) {
    console.error("Error en getReporte seguimiento:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.createSeguimiento = async (req, res, next) => {
  try {
    const { idadopcion, tipo, Fecha_Programada, iduser } = req.body;

    if (!idadopcion || !tipo || !Fecha_Programada) {
      return res.status(400).json({ code: "001", message: "Faltan datos obligatorios.", data: null });
    }
    if (!moment(Fecha_Programada, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha programada inválida.", data: null });
    }

    const adopcion = await tbladopcion.findOne({ where: { idadopcion } });
    if (!adopcion || (adopcion.Estado || "").toLowerCase() !== "adoptado") {
      return res.status(400).json({
        code: "001",
        message: "Solo se puede programar seguimiento a adopciones finalizadas.",
        data: null,
      });
    }

    await tblseguimiento.create({
      idadopcion,
      iduser: iduser || null,
      tipo,
      Fecha_Programada,
      Estado: "pendiente",
    });

    res.json({ code: "000", message: "Se programó correctamente", data: null });
  } catch (error) {
    console.error("Error en createSeguimiento:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.findByIdSeguimiento = async (req, res, next) => {
  try {
    const id = req.params.id;
    const seguimiento = await tblseguimiento.findOne({ where: { idseguimiento: id } });
    if (!seguimiento) {
      return res.json({ code: "001", message: "No existe el seguimiento", data: null });
    }
    res.json({ code: "000", message: "success", data: seguimiento });
  } catch (error) {
    console.error("Error en findByIdSeguimiento:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateSeguimiento = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ code: "001", message: "Error al subir la evidencia: " + err.message, data: null });
      }

      const id = req.params.id;
      const existe = await tblseguimiento.findOne({ where: { idseguimiento: id } });
      if (!existe) {
        return res.json({ code: "001", message: "No existe el seguimiento", data: null });
      }

      const { Estado, Observaciones, Recomendaciones, Fecha_Realizado } = req.body;

      if ((Estado || "").toLowerCase() === "realizado" && !(Observaciones || "").trim()) {
        return res.status(400).json({ code: "001", message: "Indica las observaciones del seguimiento.", data: null });
      }

      const updates = {};
      if (Estado) updates.Estado = Estado;
      if (Observaciones !== undefined) updates.Observaciones = Observaciones;
      if (Recomendaciones !== undefined) updates.Recomendaciones = Recomendaciones;
      updates.Fecha_Realizado =
        (Estado || "").toLowerCase() === "realizado" ? Fecha_Realizado || moment().format("YYYY-MM-DD") : null;
      if (req.file) updates.Evidencia = req.file.path;

      await tblseguimiento.update(updates, { where: { idseguimiento: id } });

      res.json({ code: "000", message: "Se actualizó correctamente", data: null });
    });
  } catch (error) {
    console.error("Error en updateSeguimiento:", error);
    res.status(500).json({ "Error server": error });
  }
};
