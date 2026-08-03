const tblnoticia = require("../Entity/Noticia");
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
}).single("imagen");

// Admin: todas las noticias, cualquier estado.
exports.getNoticias = async (req, res, next) => {
  try {
    const noticias = await tblnoticia.findAll({ order: [["fecharegistro", "DESC"]] });
    res.json({ code: "000", message: "success", data: noticias });
  } catch (error) {
    console.error("Error en getNoticias:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Público: solo lo publicado, para el sitio web.
exports.getNoticiasPublicas = async (req, res, next) => {
  try {
    const noticias = await tblnoticia.findAll({
      where: { Estado: "Publicado" },
      order: [["fecha_publicacion", "DESC"]],
    });
    res.json({ code: "000", message: "success", data: noticias });
  } catch (error) {
    console.error("Error en getNoticiasPublicas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.findByIdNoticia = async (req, res, next) => {
  try {
    const id = req.params.id;
    const noticia = await tblnoticia.findOne({ where: { idnoticia: id } });
    if (!noticia) {
      return res.json({ code: "001", message: "No existe la noticia", data: null });
    }
    res.json({ code: "000", message: "success", data: noticia });
  } catch (error) {
    console.error("Error en findByIdNoticia:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.createNoticia = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ code: "001", message: "Error al subir la imagen: " + err.message, data: null });
      }

      const { titulo, resumen, contenido, Estado, fecha_publicacion, iduser } = req.body;
      if (!titulo || !contenido) {
        return res.status(400).json({ code: "001", message: "El título y el contenido son obligatorios.", data: null });
      }

      const estado = Estado === "Publicado" ? "Publicado" : "Borrador";

      await tblnoticia.create({
        iduser: iduser || null,
        titulo,
        resumen: resumen || null,
        contenido,
        imagen: req.file ? req.file.path : null,
        Estado: estado,
        fecha_publicacion: estado === "Publicado" ? fecha_publicacion || new Date() : fecha_publicacion || null,
      });

      res.json({ code: "000", message: "Se creó correctamente", data: null });
    });
  } catch (error) {
    console.error("Error en createNoticia:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.updateNoticia = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ code: "001", message: "Error al subir la imagen: " + err.message, data: null });
      }

      const id = req.params.id;
      const existe = await tblnoticia.findOne({ where: { idnoticia: id } });
      if (!existe) {
        return res.json({ code: "001", message: "No existe la noticia", data: null });
      }

      const { titulo, resumen, contenido, Estado, fecha_publicacion } = req.body;
      if (!titulo || !contenido) {
        return res.status(400).json({ code: "001", message: "El título y el contenido son obligatorios.", data: null });
      }

      const estado = Estado === "Publicado" ? "Publicado" : "Borrador";

      const updates = {
        titulo,
        resumen: resumen || null,
        contenido,
        Estado: estado,
        fecha_publicacion:
          estado === "Publicado" ? fecha_publicacion || existe.fecha_publicacion || new Date() : fecha_publicacion || null,
      };
      if (req.file) updates.imagen = req.file.path;

      await tblnoticia.update(updates, { where: { idnoticia: id } });

      res.json({ code: "000", message: "Se actualizó correctamente", data: null });
    });
  } catch (error) {
    console.error("Error en updateNoticia:", error);
    res.status(500).json({ "Error server": error });
  }
};

exports.deleteNoticia = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existe = await tblnoticia.findOne({ where: { idnoticia: id } });
    if (!existe) {
      return res.json({ code: "001", message: "No existe la noticia", data: null });
    }
    await tblnoticia.destroy({ where: { idnoticia: id } });
    res.json({ code: "000", message: "Se eliminó correctamente", data: null });
  } catch (error) {
    console.error("Error en deleteNoticia:", error);
    res.status(500).json({ "Error server": error });
  }
};
