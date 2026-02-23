const sequilize = require("../database/conection");
const tbldonantes = require("../Entity/Donante");
exports.getDonante = async (req, res, next) => {
  try {
    await sequilize
      .query("CALL sp_getdonante()", { type: sequilize.QueryTypes.RAW })
      .then((results) => {
        const result = {
          code: "000",
          message: "success",
          data: results,
        };
        res.json(result);
      })
      .catch((error) => {
        console.error("Error server:", error);
        res.status(500).json({ error: "Error server" });
      });
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.createDonante = async (req, res, next) => {
  try {
    const { idtipopersona, fullname, redsocial, Ruc, Dni, Fecha_Registro } =
      req.body;
    const create = new tbldonantes({
      idtipopersona: idtipopersona,
      fullname: fullname,
      redsocial: redsocial,
      Ruc: Ruc,
      Dni: Dni,
      Fecha_Registro: Fecha_Registro,
    });
    await create.save();
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

exports.findByidEgreso = async (req, res) => {
  const id = req.params.id;

  try {
    const donante = await tbldonantes.findOne({
      where: { iddonantes: id },
    });

    if (!donante) {
      return res.status(404).json({ message: "Donante no encontrado" });
    }

    res.status(200).json({
      code: "000",
      message: "success",
      data: donante,
    });
  } catch (error) {
    console.error("Error al buscar donante:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

exports.updateEgreso = async (req, res) => {
  const id = req.params.id;
  const nuevosDatos = req.body;

  try {
    // Buscar al donante por ID
    const donante = await tbldonantes.findOne({
      where: { iddonantes: id }
    });

    // Validar si existe
    if (!donante) {
      return res.status(404).json({ message: "Donante no encontrado" });
    }

    // Actualizar con los nuevos datos
    await donante.update(nuevosDatos);

    res.status(200).json({
      code: "000",
      message: "Donante actualizado correctamente",
      data: [],
    });
  } catch (error) {
    console.error("Error al actualizar donante:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};