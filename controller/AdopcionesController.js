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

    if (fechaBusqueda && moment(fechaBusqueda, "YYYY-MM-DD", true).isValid()) {
  const fecha = moment(fechaBusqueda).format("YYYY-MM-DD");
  filters.Fecha_Adopcion = {
    [Op.between]: [
      `${fecha} 00:00:00`,
      `${fecha} 23:59:59`,
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

// Público: una persona interesada se identifica (DNI, datos de contacto) y
// postula a adoptar una mascota puntual. Crea el adoptante y la solicitud de
// adopción (Estado: "proceso") en un solo paso, y marca la mascota como no
// disponible mientras se revisa, para evitar solicitudes duplicadas.
exports.solicitarAdopcion = async (req, res, next) => {
  try {
    const { Nombre, Apellido, Dni, Direccion, telefono, Motivo, idanimal } = req.body;

    if (!Nombre || !Apellido || !Dni || !Direccion || !telefono || !Motivo || !idanimal) {
      return res.status(400).json({
        code: '001',
        message: 'Completa todos los campos para enviar tu solicitud.',
        data: null,
      });
    }

    if (!/^\d{8}$/.test(Dni)) {
      return res.status(400).json({
        code: '001',
        message: 'El DNI debe tener 8 dígitos numéricos.',
        data: null,
      });
    }

    const animal = await tblColitas.findOne({ where: { idanimal } });
    if (!animal) {
      return res.status(404).json({ code: '001', message: 'La mascota no existe.', data: null });
    }
    if (animal.estado !== 'En refugio') {
      return res.status(409).json({
        code: '001',
        message: 'Esta mascota ya no está disponible para adopción.',
        data: null,
      });
    }

    const nuevoAdoptante = await tbladoptante.create({
      Nombre,
      Apellido,
      Dni,
      Direccion,
      telefono,
      Motivo,
      Fecha_Registro: moment().format('YYYY-MM-DD'),
    });

    await tbladopcion.create({
      idadoptante: nuevoAdoptante.idadoptante,
      idanimal,
      Fecha_Adopcion: new Date(),
      Observaciones: Motivo,
      Estado: 'proceso',
      fecharegistro: new Date(),
    });

    await tblColitas.update({ estado: 'proceso' }, { where: { idanimal } });

    res.json({
      code: '000',
      message: 'Tu solicitud fue enviada. El refugio se pondrá en contacto contigo pronto.',
      data: null,
    });
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ code: '001', message: 'Error al enviar la solicitud.', data: null });
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
