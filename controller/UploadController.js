const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
      }
    }
}).single('image');

exports.saveFile = async (req, res) => {
  try {
    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({
          code: '001',
          message: 'Error al subir el archivo'+err.message,
          data: null
        });
      }
      if (!req.file) {
        return res.status(400).json({
          code: '001',
          message: 'No se ha subido ninguna imagen',
          data: null
        });
      }

      const result = {
        code: '000',
        message: 'Imagen subida correctamente',
        data: null
      };
      res.json(result);
    });
  } catch (error) {
    console.log("error server: ", error);
    res.status(500).json({ 'Error server': error });
  }
};