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



const upload = multer({ storage: storage }).single('image');

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