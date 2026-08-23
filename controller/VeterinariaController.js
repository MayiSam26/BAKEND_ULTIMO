const tblveterinaria = require("../Entity/Veterinaria");
const tblanimal = require("../Entity/Colitas");
const moment = require("moment");
const { Op } = require("sequelize");

exports.getRegistros = async (req, res, next) => {
  try {
    const { search, tipo, idanimal, misCitas, desde, hasta } = req.body || {};
    const filters = {};
    if (tipo) filters.tipo = tipo;
    if (idanimal) filters.idanimal = idanimal;

    // RF08: consulta de las citas realizadas por rango de fechas. Los dos
    // extremos son independientes: se puede filtrar solo "desde", solo
    // "hasta", o ambos. Se ignoran fechas con formato inválido.
    const desdeOk = desde && moment(desde, "YYYY-MM-DD", true).isValid();
    const hastaOk = hasta && moment(hasta, "YYYY-MM-DD", true).isValid();
    if (desdeOk || hastaOk) {
      filters.fecha = {};
      if (desdeOk) filters.fecha[Op.gte] = desde;
      if (hastaOk) filters.fecha[Op.lte] = hasta;
    }

    let order = [["fecha", "DESC"]];
    // Usado por el calendario de "Mi Calendario" del Veterinario: todas sus
    // propias atenciones (cada una es una cita en su fecha), más el
    // seguimiento si tienen próxima fecha (o registros viejos sin
    // veterinario asignado, para no ocultarlos).
    if (misCitas) {
      filters[Op.or] = [{ iduser: req.user && req.user.iduser }, { iduser: null }];
      order = [["fecha", "ASC"]];
    }

    const registros = await tblveterinaria.findAll({
      where: filters,
      order,
    });

    const idsAnimal = registros.map((r) => r.idanimal);
    const animales = await tblanimal.findAll({ where: { idanimal: { [Op.in]: idsAnimal } } });
    const animalesLimpios = animales.map((a) => a.get());

    let data = registros.map((r) => {
      const animal = animalesLimpios.find((a) => a.idanimal === r.idanimal);
      return { ...r.get(), animal: animal || null };
    });

    if (search) {
      const term = search.toLowerCase();
      data = data.filter((r) => (r.animal?.nombre || "").toLowerCase().includes(term));
    }

    res.json({ code: "000", message: "success", data });
  } catch (error) {
    console.error("Error en getRegistros veterinaria:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.getReporte = async (req, res, next) => {
  try {
    const total = await tblveterinaria.count();
    const tipos = ["Diagnóstico", "Vacuna", "Tratamiento", "Esterilización", "Control médico"];
    const porTipo = {};
    for (const t of tipos) {
      porTipo[t] = await tblveterinaria.count({ where: { tipo: t } });
    }
    const hoy = moment().format("YYYY-MM-DD");
    const proximos = await tblveterinaria.count({
      where: { proxima_fecha: { [Op.gte]: hoy } },
    });
    res.json({ code: "000", message: "success", data: [{ total, porTipo, proximos }] });
  } catch (error) {
    console.error("Error en getReporte veterinaria:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.findByIdRegistro = async (req, res, next) => {
  try {
    const id = req.params.id;
    const registro = await tblveterinaria.findOne({ where: { idveterinaria: id } });
    if (!registro) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }
    res.json({ code: "000", message: "success", data: registro });
  } catch (error) {
    console.error("Error en findByIdRegistro:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.createRegistro = async (req, res, next) => {
  try {
    const { idanimal, tipo, descripcion, fecha, proxima_fecha, observaciones, iduser } = req.body;

    if (!idanimal || !tipo || !descripcion || !fecha) {
      return res.status(400).json({
        code: "001",
        message: "El animal, tipo, descripción y fecha son obligatorios.",
        data: null,
      });
    }
    if (!moment(fecha, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha inválida.", data: null });
    }
    if (proxima_fecha && !moment(proxima_fecha, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Próxima fecha inválida.", data: null });
    }

    const animal = await tblanimal.findOne({ where: { idanimal } });
    if (!animal) {
      return res.status(404).json({ code: "001", message: "La mascota no existe.", data: null });
    }

    // Si quien registra es Veterinario, la cita queda enlazada a su propio
    // usuario automáticamente (para que le aparezca en su calendario). Si es
    // Administrador, se respeta el iduser que mande el body (o null).
    const iduserFinal = req.user && req.user.rol === "Veterinario" ? req.user.iduser : (iduser || null);

    await tblveterinaria.create({
      idanimal,
      iduser: iduserFinal,
      tipo,
      descripcion,
      fecha,
      proxima_fecha: proxima_fecha || null,
      observaciones: observaciones || null,
    });

    res.json({ code: "000", message: "Se registró correctamente", data: null });
  } catch (error) {
    console.error("Error en createRegistro veterinaria:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateRegistro = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblveterinaria.findOne({ where: { idveterinaria: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }

    const { tipo, descripcion, fecha, proxima_fecha, observaciones, Estado } = req.body;
    if (!tipo || !descripcion || !fecha) {
      return res.status(400).json({
        code: "001",
        message: "El tipo, descripción y fecha son obligatorios.",
        data: null,
      });
    }
    if (!moment(fecha, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha inválida.", data: null });
    }

    const updates = { tipo, descripcion, fecha, proxima_fecha: proxima_fecha || null, observaciones: observaciones || null };
    if (Estado === "Pendiente" || Estado === "Realizado") updates.Estado = Estado;

    await tblveterinaria.update(updates, { where: { idveterinaria: id } });

    res.json({ code: "000", message: "Se actualizó correctamente", data: null });
  } catch (error) {
    console.error("Error en updateRegistro veterinaria:", error);
    res.status(500).json({ "Error server": error });
  }
};

// Toggle rápido desde la tabla: marcar un control como Realizado/Pendiente
// sin tener que abrir el modal de edición completo.
exports.setEstado = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { Estado } = req.body;
    if (Estado !== "Pendiente" && Estado !== "Realizado") {
      return res.status(400).json({ code: "001", message: "Estado inválido.", data: null });
    }
    const existe = await tblveterinaria.findOne({ where: { idveterinaria: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }
    await tblveterinaria.update({ Estado }, { where: { idveterinaria: id } });
    res.json({ code: "000", message: "Se actualizó correctamente", data: null });
  } catch (error) {
    console.error("Error en setEstado veterinaria:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.deleteRegistro = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblveterinaria.findOne({ where: { idveterinaria: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }
    await tblveterinaria.destroy({ where: { idveterinaria: id } });
    res.json({ code: "000", message: "Se eliminó correctamente", data: null });
  } catch (error) {
    console.error("Error en deleteRegistro veterinaria:", error);
    res.status(500).json({ "Error server": error });
  }
};
