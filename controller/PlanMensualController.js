const tblplanmensual = require("../Entity/Plan");
const sequilize = require("../database/conection")
const multer = require('multer');
const path = require('path');
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + path.basename(file.originalname));
    }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
        }
    }
}).single('img');

exports.getPlanMensual = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_getPlanMensual()', { type: sequilize.QueryTypes.RAW })
        .then(results => {
            // Este endpoint es público (lo consume la portada). El
            // procedimiento hace SELECT *, así que se recortan las columnas de
            // auditoría antes de responder: quién editó un canal de pago y
            // cuándo no tiene por qué verlo cualquiera desde internet.
            const publico = (results || []).map((fila) => ({
                idplanmensual: fila.idplanmensual,
                img: fila.img,
                nombre: fila.nombre,
                content: fila.content,
                cantidad: fila.cantidad,
            }));
            const result ={
                code :'000',
                message:'success',
                data:publico
            }
            res.json(result); 
        })
        .catch(error => {
          
            console.error('Error server:', error);
            res.status(500).json({ error: 'Error server' });
        });
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.createPlanMensual = async (req, res, next) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          return res.status(500).json({
            code: '001',
            message: 'Error al subir el archivo ' + err.message,
            data: null
          });
        }
        const { content, nombre, cantidad } = req.body;

        // El canal necesita nombre y logo (cantidad guarda la URL del logo);
        // el archivo adjunto es opcional porque el sitio público no lo usa.
        if (!nombre || !cantidad) {
          return res.status(400).json({
            code: '001',
            message: 'El canal y la URL del logo son obligatorios',
            data: null
          });
        }

        const planMensual = new tblplanmensual({
          nombre: nombre,
          content: content,
          img: req.file ? req.file.path : '',
          cantidad: cantidad,
          ...sellarCreacion(req)
        });

        await planMensual.save();
        const resultado = {
          code: '000',
          message: 'Se creó correctamente',
          data: null
        };
        res.json(resultado);
      });
    } catch (error) {
      console.log("error server: ", error);
      res.status(400).json({
        code: '001',
        message: error,
        data: null
      });
    }
  };

exports.updatePlanMensual = async (req, res, next) => {
    try {
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({ error: 'Error al subir la imagen', details: err });
            } else if (err) {
                
                return res.status(500).json({ error: 'Ocurrió un error', details: err });
            }

           
            const id = req.params.id; 
            const plan = await tblplanmensual.findOne({
                where: {
                    idplanmensual: id
                }
            });

            if (!plan) {
                const result = {
                    code: '001',
                    message: 'No existe el plan',
                    data: null
                };
                return res.json(result); 
            }

            const { nombre, content, cantidad } = req.body;

            // Se arma el cambio solo con lo que realmente vino: así subir un
            // logo nuevo no borra el nombre ni los datos de la cuenta, que es
            // lo que pasaba cuando el formulario mandaba el archivo solo.
            const cambios = {};
            if (nombre !== undefined) cambios.nombre = nombre;
            if (content !== undefined) cambios.content = content;
            if (cantidad !== undefined) cambios.cantidad = cantidad;
            if (req.file) cambios.img = req.file.path;

            await tblplanmensual.update(sellarModificacion(req, cambios), {
                where: {
                    idplanmensual: id
                }
            });
            const result = {
                code: '000',
                message: 'Se actualizó correctamente',
                data: null
            };
            res.json(result); 
        });

        
    } catch (error) {
        console.log("error server: ", error);
        res.status(500).json({ 'Error server': error });
    }
}






exports.deletPlanById = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const planFindOne = await tblplanmensual.findOne({
            where:{
                idplanmensual: id
            }
        })

        if(!planFindOne){
            const result ={
                code :'001',
                message:'No existe el plan',
                data:null
            }
            res.json(result); 
        }else{
            await tblplanmensual.destroy({
                where:{
                    idplanmensual:id
                }
            })
            const result ={
                code :'000',
                message:'Se Elimino con exito!',
                data:null
            }
            res.json(result); 
        }

    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.getDetailPlan = async(req, res, next)=>{
    try {
        const id = req.params.id;
        await sequilize.query(`CALL sp_getByIdPlanMensual(?)`, { replacements: [id], type: sequilize.QueryTypes.RAW })
        .then(results => {
            const result ={
                code :'000',
                message:'success',
                data:results[0]
            }
            res.json(result); 
        })
        .catch(error => {
          
            console.error('Error server:', error);
            res.status(500).json({ error: 'Error server' });
        });
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}