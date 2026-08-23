const tbladoptante = require("../Entity/Adoptantes");
const sequilize = require("../database/conection");
const moment = require("moment");
const { Op } = require("sequelize");
const { sellarModificacion } = require("../helpers/auditoria");

exports.getAdoptantes = async (req, res, next) => {
  try {
    const { search, fechaBusqueda, telefono } = req.body;

    let filters = {};

    if (search) {
        filters[Op.or] = [
            { Dni: { [Op.like]: `%${search}%` } },
            { Apellido: { [Op.like]: `%${search}%` } },
            { Nombre: { [Op.like]: `%${search}%` } }
          ];
    }

    if (telefono) {
      filters.telefono = { [Op.like]: `%${telefono}%` };
    }

    if (fechaBusqueda && moment(fechaBusqueda, "YYYY-MM-DD", true).isValid()) {
      // Rango del día completo en vez de igualdad exacta: Fecha_Registro es
      // un DATETIME con hora real, así que Op.eq nunca calzaba con la fecha
      // que el usuario elegía en el filtro.
      const fecha = moment(fechaBusqueda).format("YYYY-MM-DD");
      filters.Fecha_Registro = {
        [Op.between]: [`${fecha} 00:00:00`, `${fecha} 23:59:59`],
      };
    }

    const adoptante = await tbladoptante.findAll({
      where: filters,
    });
  

    res.json({
      code: "000",
      message: "success",
      data: adoptante,
    });
  } catch (error) {
    console.error("Error en getAdoptantes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.findByAdoptante = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tbladoptante.findOne({
      where: {
        idadoptante: id,
      },
    });
    if (!existe) {
      const result = {
        code: "001",
        message: "No existe el adoptante",
        data: null,
      };
      res.json(result);
      next();
    } else {
      const results = await tbladoptante.findOne({
        where: {
          idadoptante: id,
        },
      });

      const result = {
        code: "000",
        message: "sucess",
        data: results,
      };
      res.json(result);
    }
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateAdoptante = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tbladoptante.findOne({
      where: {
        idadoptante: id,
      },
    });
    if (!existe) {
      const result = {
        code: "001",
        message: "No existe el adoptante",
        data: null,
      };
      res.json(result);
      next();
    } else {
      // Un DNI, una persona: al editar no se puede pisar el documento de otro
      // adoptante ya registrado.
      if (req.body.Dni) {
        const repetido = await tbladoptante.findOne({
          where: { Dni: req.body.Dni, idadoptante: { [Op.ne]: id } },
        });
        if (repetido) {
          return res.json({
            code: "001",
            message: `El DNI ${req.body.Dni} ya pertenece a ${repetido.Nombre} ${repetido.Apellido}.`,
            data: null,
          });
        }
      }

      await tbladoptante.update(sellarModificacion(req, req.body), {
        where: {
          idadoptante: id,
        },
      });

      const result = {
        code: "000",
        message: "Se actulizo correctamente",
        data: null,
      };
      res.json(result);
    }
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};
