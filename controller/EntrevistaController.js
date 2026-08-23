const tblentrevista = require("../Entity/Entrevista");
const tbladopcion = require("../Entity/Adopciones");
const tbladoptante = require("../Entity/Adoptantes");
const tblColitas = require("../Entity/Colitas");
const moment = require("moment");
const { Op } = require("sequelize");
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");

exports.getEntrevistas = async (req, res, next) => {
  try {
    const { estado, idadopcion } = req.body || {};
    const filters = {};
    if (estado) filters.Estado = estado;
    if (idadopcion) filters.idadopcion = idadopcion;

    const entrevistas = await tblentrevista.findAll({
      where: filters,
      order: [["Fecha_Entrevista", "DESC"]],
    });

    const idsAdopcion = entrevistas.map((e) => e.idadopcion);
    const adopciones = await tbladopcion.findAll({ where: { idadopcion: { [Op.in]: idsAdopcion } } });
    const idsAdoptante = adopciones.map((a) => a.idadoptante);
    const idsAnimal = adopciones.map((a) => a.idanimal);

    const adoptantes = await tbladoptante.findAll({ where: { idadoptante: { [Op.in]: idsAdoptante } } });
    const animales = await tblColitas.findAll({ where: { idanimal: { [Op.in]: idsAnimal } } });

    const adopcionesLimpias = adopciones.map((a) => a.get());
    const adoptantesLimpios = adoptantes.map((a) => a.get());
    const animalesLimpios = animales.map((a) => a.get());

    const data = entrevistas.map((e) => {
      const adopcion = adopcionesLimpias.find((a) => a.idadopcion === e.idadopcion) || null;
      const adoptante = adopcion ? adoptantesLimpios.find((a) => a.idadoptante === adopcion.idadoptante) : null;
      const animal = adopcion ? animalesLimpios.find((a) => a.idanimal === adopcion.idanimal) : null;
      return {
        ...e.get(),
        adopcion,
        adoptante: adoptante || null,
        animal: animal || null,
      };
    });

    res.json({ code: "000", message: "success", data });
  } catch (error) {
    console.error("Error en getEntrevistas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.getReporte = async (req, res, next) => {
  try {
    const total = await tblentrevista.count();
    const pendiente = await tblentrevista.count({ where: { Estado: "pendiente" } });
    const realizada = await tblentrevista.count({ where: { Estado: "realizada" } });
    res.json({ code: "000", message: "success", data: [{ total, pendiente, realizada }] });
  } catch (error) {
    console.error("Error en getReporte entrevista:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.createEntrevista = async (req, res, next) => {
  try {
    const { idadopcion, Fecha_Entrevista, Hora_Entrevista, iduser } = req.body;

    if (!idadopcion || !Fecha_Entrevista) {
      return res.status(400).json({ code: "001", message: "Faltan datos obligatorios.", data: null });
    }
    if (!moment(Fecha_Entrevista, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha de entrevista inválida.", data: null });
    }

    const adopcion = await tbladopcion.findOne({ where: { idadopcion } });
    if (!adopcion || (adopcion.Estado || "").toLowerCase() !== "proceso") {
      return res.status(400).json({
        code: "001",
        message: "Solo se puede programar entrevista a solicitudes en proceso.",
        data: null,
      });
    }

    await tblentrevista.create({
      idadopcion,
      iduser: iduser || null,
      Fecha_Entrevista,
      Hora_Entrevista: Hora_Entrevista || null,
      Estado: "pendiente",
      ...sellarCreacion(req),
    });

    res.json({ code: "000", message: "Se programó correctamente", data: null });
  } catch (error) {
    console.error("Error en createEntrevista:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.findByIdEntrevista = async (req, res, next) => {
  try {
    const id = req.params.id;
    const entrevista = await tblentrevista.findOne({ where: { identrevista: id } });
    if (!entrevista) {
      return res.json({ code: "001", message: "No existe la entrevista", data: null });
    }
    res.json({ code: "000", message: "success", data: entrevista });
  } catch (error) {
    console.error("Error en findByIdEntrevista:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateEntrevista = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblentrevista.findOne({ where: { identrevista: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe la entrevista", data: null });
    }

    const { Respuestas, Observaciones, Cumple_Requisitos } = req.body;

    if (!(Observaciones || "").trim() || !Cumple_Requisitos) {
      return res.status(400).json({
        code: "001",
        message: "Indica las observaciones y si cumple los requisitos.",
        data: null,
      });
    }

    await tblentrevista.update(
      sellarModificacion(req, {
        Estado: "realizada",
        Respuestas: Respuestas || null,
        Observaciones,
        Cumple_Requisitos,
      }),
      { where: { identrevista: id } }
    );

    res.json({ code: "000", message: "Se actualizó correctamente", data: null });
  } catch (error) {
    console.error("Error en updateEntrevista:", error);
    res.status(500).json({ "Error server": error });
  }
};
