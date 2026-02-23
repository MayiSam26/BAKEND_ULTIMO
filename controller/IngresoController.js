const sequilize = require("../database/conection");
const moment = require("moment");
const multer = require("multer");
const path = require("path");
const tblingreso = require("../Entity/Ingresos");
const tbldonante = require("../Entity/Donante");
const { fn, col } = require("sequelize");
const { Op } = require("sequelize");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).single("evidencia");
exports.getIngresos = async (req, res, next) => {
    try {
      // 1. Obtener todos los ingresos
      const ingresos = await tblingreso.findAll({ raw: true });
  
      // 2. Extraer los IDs de donantes únicos desde ingresos
      const idsDonantes = ingresos.map(item => item.iddonantes).filter(Boolean);
  
      // 3. Obtener todos los donantes relacionados
      const donantes = await tbldonante.findAll({
        where: { iddonantes: { [Op.in]: idsDonantes } },
        raw: true,
      });
  
      // 4. Asociar donantes a cada ingreso
      const data = ingresos.map(ingreso => {
        const donante = donantes.find(d => d.iddonantes === ingreso.iddonantes);
        return {
          ...ingreso,
          donante: donante ?? null,
        };
      });
  
      // 5. Respuesta
      res.json({
        code: "000",
        message: "success",
        data,
      });
  
    } catch (error) {
      console.error("Error server:", error);
      res.status(500).json({ error: "Error server" });
    }
  };

exports.getReporte = async (req, res, next) => {
  try {
    // Total de registros
    const cantIngreso = await tblingreso.findOne({
      attributes: [[fn("COUNT", col("idtblingreso")), "cantIngreso"]],
      raw: true,
    });

    // Registros con suministro 'Ninguno'
    const ninguno = await tblingreso.findOne({
      attributes: [[fn("COUNT", col("idtblingreso")), "ninguno"]],
      where: { suministro: "Si" },
      raw: true,
    });

    // Registros con pago 'Plin'
    const plin = await tblingreso.findOne({
      attributes: [[fn("COUNT", col("idtblingreso")), "plin"]],
      where: { pago: "Plin" },
      raw: true,
    });

    // Registros con pago 'Yape'
    const yape = await tblingreso.findOne({
      attributes: [[fn("COUNT", col("idtblingreso")), "yape"]],
      where: { pago: "Yape" },
      raw: true,
    });

    res.json({
      code: "000",
      message: "success",
      data: [
        {
          ...cantIngreso,
          ...ninguno,
          ...plin,
          ...yape,
        },
      ],
    });
  } catch (error) {
    console.log("Error server:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.createIngreso = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({
          code: "001",
          message: "Error al subir el archivo " + err.message,
          data: null,
        });
      }
      if (!req.file) {
        return res.status(400).json({
          code: "001",
          message: "No se ha subido ninguna imagen",
          data: null,
        });
      }

      const imageUrl = req.file.path;
      const {
        iddonantes,
        monto,
        suministro,
        fecha_registro,
        donacion,
        pago,
        evidencia,
      } = req.body;
      const createIngreso = new tblingreso({
        iddonantes: iddonantes,
        monto: monto,
        suministro: suministro,
        fecha_registro: fecha_registro,
        donacion: donacion,
        pago: pago,
        evidencia: imageUrl,
      });

      await createIngreso.save();
      const resultado = {
        code: "000",
        message: "Se creó correctamente",
        data: null,
      };
      res.json(resultado);
    });
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ "Error server": error });
  }
};
