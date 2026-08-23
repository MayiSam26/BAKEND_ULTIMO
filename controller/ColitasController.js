const tblanimal = require("../Entity/Colitas");
const tbltipo = require("../Entity/TipoAnimal");
const tblgenero = require("../Entity/Genero");
const sequilize = require("../database/conection")
const moment = require("moment");
const multer = require('multer');
const path = require('path');
const { Op } = require("sequelize");
const tbltipoanimal = require("../Entity/TipoAnimal");
const { cerrarApadrinamientosSiSalio } = require("../helpers/apadrinamiento");
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // path.basename descarta cualquier segmento de ruta (../, /) del
        // nombre original para evitar path traversal, y el timestamp evita
        // que dos subidas con el mismo nombre se pisen entre sí.
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
}).single('foto');

exports.getColitas = async (req, res) => {
    try {
        const { search, p_tamano, p_idtipoanimal, p_idgenero, fechaBusqueda, estado, estados, limite } = req.body;

        let filters = {};

        if (search) {
            filters.nombre = { [Op.like]: `%${search}%` };
        }

        if (p_tamano) {
            filters.tamano = p_tamano;
        }

        if (p_idtipoanimal) {
            filters.idtipoanimal = p_idtipoanimal;
        }

        if (p_idgenero) {
            filters.idgenero = p_idgenero;
        }

        if (fechaBusqueda && moment(fechaBusqueda, "YYYY-MM-DD", true).isValid()) {
            const fecha = moment(fechaBusqueda).format("YYYY-MM-DD");
            filters.Fecha_Ingreso = {
                [Op.between]: [
                    `${fecha} 00:00:00`,
                    `${fecha} 23:59:59`,
                ],
            };
        }

        if (estado) {
            filters.estado = estado;
        }

        // "estados" permite pedir varios a la vez (ej. las que siguen dentro
        // del albergue: "En refugio" y "proceso"), sin tener que hacer una
        // consulta por cada uno.
        if (Array.isArray(estados) && estados.length > 0) {
            filters.estado = { [Op.in]: estados };
        }

        // ✅ Consulta con o sin límite
        const animales = await tblanimal.findAll({
            where: filters,
            limit: limite ? parseInt(limite) : undefined, // 👈 aquí está el control
        });

        const idsTipoAnimal = animales.map(item => item.idtipoanimal);
        const idsGenero = animales.map(item => item.idgenero);

        const tiposAnimales = await tbltipoanimal.findAll({
            where: {
                idtipoanimal: { [Op.in]: idsTipoAnimal }
            }
        });

        const tiposGeneros = await tblgenero.findAll({
            where: {
                idgenero: { [Op.in]: idsGenero }
            }
        });

        const tiposAnimalesLimpios = tiposAnimales.map(item => item.get());
        const tiposGeneroLimpios = tiposGeneros.map(item => item.get());

        const data = animales.map(animal => {
            const tipo = tiposAnimalesLimpios.find(t => t.idtipoanimal === animal.idtipoanimal);
            const genero = tiposGeneroLimpios.find(t => t.idgenero === animal.idgenero);
            return {
                ...animal.get(),
                tipo_descripcion: tipo ?? null,
                genero: genero ?? null
            };
        });

        res.json({
            code: "000",
            message: "success",
            data: data,
        });

    } catch (error) {
        console.error("Error en getColitas:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};



exports.createColitas = async (req, res, next) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    code: '001',
                    message: 'Error al subir el archivo ' + err.message,
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

            const imageUrl = req.file.path;
            const { nombre, idtipoanimal,idadopcion, idgenero, tamano, peso, Edada_Aprox, foto, observaciones, estado, esterelizacion, Fecha_Ingreso,fechaRegistro} = req.body;
            const createAnimal = new tblanimal({
                nombre: nombre,
                idadopcion:idadopcion==""?null:null,
                idtipoanimal: idtipoanimal,
                idgenero:idgenero,
                tamano:tamano,
                peso:peso,
                Edada_Aprox:Edada_Aprox,
                foto: imageUrl,
                estado:estado,
                observaciones:observaciones,
                esterelizacion:esterelizacion,
                Fecha_Ingreso: Fecha_Ingreso,
                fechaRegistro:fechaRegistro,
                ...sellarCreacion(req),
            });

            await createAnimal.save();
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
}
exports.findByIcolitas =  async (req, res, next) => {
    try {
        const id = req.params.id; 
        const existe = await tblanimal.findOne({
            where:{
                idanimal: id
            }
        })
        if(!existe){
            const result ={
                code :'001',
                message:'No existe la colitas',
                data:null
            }
            res.json(result); 
            next()
        }else{
           const colitas =  await tblanimal.findOne({
                where:{
                    idanimal: id
                }
            })
            const result ={
                code :'000',
                message:'success',
                data:colitas
            }
            res.json(result); 
        }
    } catch (error) {
        console.log("error server: ", error);
        res.status(400).json({
            code: '001',
            message: error,
            data: null
        });
    }
}

exports.updateColitas = async (req, res, next) => {
    try {
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({ error: 'Error al subir la imagen', details: err });
            } else if (err) {
                return res.status(500).json({ error: 'Ocurrió un error', details: err });
            }

            const id = req.params.id;
            const plan = await tblanimal.findOne({
                where: { idanimal: id }
            });

            if (!plan) {
                return res.json({
                    code: '001',
                    message: 'No existe una colita',
                    data: null
                });
            }

            const { esterelizacion, observaciones, estado } = req.body;
            let imgUrl = '';

            if (req.file) {
                imgUrl = req.file.path;
            }

            const updates = {};
            if (esterelizacion) updates.esterelizacion = esterelizacion;
            if (observaciones) updates.observaciones = observaciones;
            if (imgUrl) updates.foto = imgUrl;
            if (estado) updates.estado = estado;

            try {
                await tblanimal.update(sellarModificacion(req, updates), { where: { idanimal: id } });
                // Si la mascota deja el albergue, sus apadrinamientos activos
                // ya no corresponden: se cierran solos.
                if (estado) await cerrarApadrinamientosSiSalio(id, estado);

                res.json({
                    code: '000',
                    message: 'Se actualizó correctamente',
                    data: null
                });
            } catch (dbError) {
                console.error("Database error: ", dbError);
                res.status(500).json({
                    code: '002',
                    message: 'Error al actualizar la base de datos',
                    details: dbError
                });
            }
        });
    } catch (error) {
        console.error("Server error: ", error);
        res.status(400).json({
            code: '001',
            message: 'Error del servidor',
            details: error
        });
    }
}