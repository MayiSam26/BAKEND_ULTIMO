const tbladopcion = require("../Entity/Adopciones");
const tbladoptante = require("../Entity/Adoptantes");
const tblColitas = require("../Entity/Colitas");
const sequilize = require("../database/conection");
const moment = require("moment");
const { Op } = require("sequelize");
const { fn, col } = require("sequelize");

exports.getAdopciones = async (req, res, next) => {
  try {
    const { fechaBusqueda, state } = req.body;
    let filters = {};

    if (state) {
      filters.Estado = state;
    }

    if (fechaBusqueda) {
  filters.Fecha_Adopcion = {
    [Op.between]: [
      `${fechaBusqueda} 00:00:00`,
      `${fechaBusqueda} 23:59:59`,
    ],
  };
}

    const adopcion = await tbladopcion.findAll({
      where: filters,
    });

    const idsAdopcion = adopcion.map((item) => item.idadoptante);
    const idsAnimal = adopcion.map((item) => item.idanimal);

    const adoptantes = await tbladoptante.findAll({
      where: {
        idadoptante: { [Op.in]: idsAdopcion },
      },
    });

    const animales = await tblColitas.findAll({
      where: {
        idanimal: { [Op.in]: idsAnimal },
      },
    });

    const tipoAdoptantesLimpios = adoptantes.map((item) => item.get());
    const animalesLimpios = animales.map((item) => item.get());

    const data = adopcion.map((animal) => {
      const adoptante = tipoAdoptantesLimpios.find(
        (t) => t.idadoptante === animal.idadoptante
      );
      const animales = animalesLimpios.find(
        (t) => t.idanimal === animal.idanimal
      );
      return {
        ...animal.get(), // o animal.toJSON()
        adoptante: adoptante ?? null,
        animales: animales ?? null,
      };
    });

    res.json({
      code: "000",
      message: "success",
      data: data,
    });
  } catch (error) {
    console.error("Error en getAdoptantes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.getReporte = async (req, res, next) => {
    try {
      // Total de adopciones
      const total = await tbladopcion.findOne({
        attributes: [[fn("COUNT", col("idadopcion")), "cantadopci"]],
        raw: true
      });
  
      // Total de adopciones finalizadas, nombrado como "adoptado"
      const adoptado = await tbladopcion.findOne({
        attributes: [[fn("COUNT", col("idadopcion")), "adoptado"]],
        where: { Estado: "adoptado" },
        raw: true
      });

      const proceso = await tbladopcion.findOne({
        attributes: [[fn("COUNT", col("idadopcion")), "proceso"]],
        where: { Estado: "proceso" },
        raw: true
      });
  
      res.json({ 
        code: "000",
        message: "success",
        data: [{
            ...total,
            ...adoptado,
            ...proceso
          }]
      });
    } catch (error) {
      console.log("Error server:", error);
      res.status(500).json({ 'Error server': error });
    }
  };
exports.createAdopcion = async (req, res, next) => {
  try {
    console.log("req.body;",req.body)
    const {
      iduser,
      Nombre,
      Apellido,
      Dni,
      Direccion,
      telefono,
      Motivo,
      Fecha_Registro,
    } = req.body;
    console.log("req.body;",req.body)
    const createAdoptante = new tbladoptante({
      iduser: iduser,
      Nombre: Nombre,
      Apellido: Apellido,
      Dni: Dni,
      Direccion: Direccion,
      telefono: telefono,
      Motivo: Motivo,
      Fecha_Registro,
    });
    await createAdoptante.save();
    const result = {
      code: "000",
      message: "Se creo correctamente",
      data: null,
    };
    res.json(result);
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.createAdopcionColitas = async (req, res, next) => {
  try {
    const {
      iduser,
      idadoptante,
      idanimal,
      Fecha_Adopcion,
      Observaciones,
      Estado,
      fecharegistro,
    } = req.body;
 
    const createAdopcion = new tbladopcion({
      iduser: iduser,
      idadoptante: idadoptante,
      idanimal: idanimal,
      Fecha_Adopcion: Fecha_Adopcion,
      Observaciones: Observaciones,
      Estado: Estado,
      fecharegistro: fecharegistro,
    });

    await createAdopcion.save();
    await tblColitas.update(
        { estado: Estado}, 
        { where: { idanimal } }
      )

   
    const result = {
      code: "000",
      message: "Se creo correctamente",
      data: null,
    };
    res.json(result);
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.findByIdAdopcion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tbladopcion.findOne({
      where: {
        idadopcion: id,
      },
    });
    if (!existe) {
      const result = {
        code: "001",
        message: "No existe la adopcion",
        data: null,
      };
      res.json(result);
      next();
    } else {
      const results = await tbladopcion.findOne({
        where: {
          idadopcion: id,
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

exports.updateAdopcion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tbladopcion.findOne({
      where: {
        idadopcion: id,
      },
    });
   
    if (!existe) {
      const result = {
        code: "001",
        message: "No existe la adopcion",
        data: null,
      };
      res.json(result);
      next();
    } else {
      await tbladopcion.update(req.body, {
        where: {
          idadopcion: id,
        },
      });

      console.log("req.body",req.body)
      await tblColitas.update(
        {estado:req.body.Estado},
      { where: { idanimal: existe.idanimal } }
    );

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
