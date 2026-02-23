const tbladoptante = require("../Entity/Adoptantes");
const sequilize = require("../database/conection");
const moment = require("moment");
const { Op } = require("sequelize");

exports.getAdoptantes = async (req, res, next) => {
  try {
    const { search, fechaBusqueda } = req.body;

    let filters = {};

    if (search) {
        filters[Op.or] = [
            { Dni: { [Op.like]: `%${search}%` } },
            { Apellido: { [Op.like]: `%${search}%` } },
            { Nombre: { [Op.like]: `%${search}%` } }
          ];
    }

    if (fechaBusqueda) {
      filters.Fecha_Registro = {
        [Op.eq]: fechaBusqueda,
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
      await tbladoptante.update(req.body, {
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
