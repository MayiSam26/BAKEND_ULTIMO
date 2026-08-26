const tblvoluntariovisita = require("../Entity/VoluntarioVisita");
const tblUser = require("../Entity/User");
const moment = require("moment");
const { Op } = require("sequelize");
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");

exports.getVisitas = async (req, res, next) => {
  try {
    const rol = req.user && req.user.rol;
    const { iduser, mes } = req.body || {};
    const filters = {};

    // Un Voluntario (o cualquier rol que no sea Administrador) solo puede
    // ver sus propias visitas, sin importar qué mande en el body.
    if (rol === "Administrador") {
      if (iduser) filters.iduser = iduser;
    } else {
      filters.iduser = req.user.iduser;
    }

    if (mes && moment(mes, "YYYY-MM", true).isValid()) {
      const inicio = moment(mes, "YYYY-MM").startOf("month").format("YYYY-MM-DD");
      const fin = moment(mes, "YYYY-MM").endOf("month").format("YYYY-MM-DD");
      filters.fecha = { [Op.between]: [inicio, fin] };
    }

    const visitas = await tblvoluntariovisita.findAll({
      where: filters,
      order: [["fecha", "ASC"]],
    });

    const idsUser = visitas.map((v) => v.iduser);
    const usuarios = await tblUser.findAll({ where: { iduser: { [Op.in]: idsUser } } });
    const usuariosLimpios = usuarios.map((u) => u.get());

    const data = visitas.map((v) => {
      const voluntario = usuariosLimpios.find((u) => u.iduser === v.iduser);
      return {
        ...v.get(),
        voluntario: voluntario
          ? { iduser: voluntario.iduser, nombres: voluntario.nombres, apellidos: voluntario.apellidos, usuario: voluntario.usuario }
          : null,
      };
    });

    res.json({ code: "000", message: "success", data });
  } catch (error) {
    console.error("Error en getVisitas voluntariado:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.createVisita = async (req, res, next) => {
  try {
    const { iduser, fecha, nota } = req.body;

    if (!iduser || !fecha) {
      return res.status(400).json({
        code: "001",
        message: "El voluntario y la fecha son obligatorios.",
        data: null,
      });
    }
    if (!moment(fecha, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha inválida.", data: null });
    }

    const usuario = await tblUser.findOne({ where: { iduser } });
    if (!usuario) {
      return res.status(404).json({ code: "001", message: "El usuario no existe.", data: null });
    }
    if (usuario.rol !== "Voluntario") {
      return res.status(400).json({ code: "001", message: "El usuario seleccionado no tiene rol de Voluntario.", data: null });
    }

    await tblvoluntariovisita.create({
      iduser,
      fecha,
      nota: nota || null,
      ...sellarCreacion(req),
    });

    res.json({ code: "000", message: "Se registró correctamente", data: null });
  } catch (error) {
    console.error("Error en createVisita voluntariado:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateVisita = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblvoluntariovisita.findOne({ where: { idvisita: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }

    const { fecha, nota, Estado } = req.body;
    if (!fecha) {
      return res.status(400).json({ code: "001", message: "La fecha es obligatoria.", data: null });
    }
    if (!moment(fecha, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ code: "001", message: "Fecha inválida.", data: null });
    }

    const updates = { fecha, nota: nota || null };
    if (Estado === "Pendiente" || Estado === "Realizado") updates.Estado = Estado;

    await tblvoluntariovisita.update(sellarModificacion(req, updates), { where: { idvisita: id } });

    res.json({ code: "000", message: "Se actualizó correctamente", data: null });
  } catch (error) {
    console.error("Error en updateVisita voluntariado:", error);
    res.status(500).json({ "Error server": error });
  }
};

// Marcar una visita como realizada (o volverla a pendiente) sin abrir el
// formulario completo, igual que el atajo de estado de Veterinaria. El
// Administrador puede marcar cualquiera; un voluntario, solo las suyas, que
// es justamente quien sabe si la visita ocurrio.
exports.setEstado = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { Estado } = req.body;
    if (Estado !== "Pendiente" && Estado !== "Realizado") {
      return res.status(400).json({ code: "001", message: "Estado invalido.", data: null });
    }
    const existe = await tblvoluntariovisita.findOne({ where: { idvisita: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }
    const rol = req.user && req.user.rol;
    if (rol && rol !== "Administrador" && existe.iduser !== req.user.iduser) {
      return res.status(403).json({
        code: "001",
        message: "Solo puedes cambiar el estado de tus propias visitas.",
        data: null,
      });
    }
    await tblvoluntariovisita.update(sellarModificacion(req, { Estado }), { where: { idvisita: id } });
    res.json({ code: "000", message: "Se actualizo correctamente", data: null });
  } catch (error) {
    console.error("Error en setEstado voluntariado:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.deleteVisita = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblvoluntariovisita.findOne({ where: { idvisita: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe el registro", data: null });
    }
    await tblvoluntariovisita.destroy({ where: { idvisita: id } });
    res.json({ code: "000", message: "Se eliminó correctamente", data: null });
  } catch (error) {
    console.error("Error en deleteVisita voluntariado:", error);
    res.status(500).json({ "Error server": error });
  }
};
