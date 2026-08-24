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
const { conEdad, nacimientoDesdeEstimacion } = require("../helpers/edad");

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
            // La edad se calcula al vuelo desde la fecha de nacimiento, no se
            // lee de una columna: así nunca queda desactualizada.
            return conEdad({
                ...animal.get(),
                tipo_descripcion: tipo ?? null,
                genero: genero ?? null
            });
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



// Estados de los que sale un animal del albergue por una via que no es la
// adopcion. Marcar uno de estos sin decir por que deja un hueco en la
// trazabilidad, asi que el motivo es obligatorio.
const ESTADOS_CON_MOTIVO = ["De baja", "Fallecido"];

/** Devuelve un mensaje de error si el estado exige motivo y no lo trae. */
function validarMotivo(estado, motivo) {
    if (!estado || !ESTADOS_CON_MOTIVO.includes(estado)) return null;
    if (!motivo || !String(motivo).trim()) {
        return `Para marcar la mascota como "${estado}" hay que indicar el motivo.`;
    }
    return null;
}

/**
 * Resuelve la fecha de nacimiento a guardar a partir de lo que mande el
 * formulario: o la fecha exacta, o la que implica la edad estimada al
 * ingresar. Devuelve {fecha_nacimiento, nacimiento_exacto} o null si no hay
 * datos suficientes.
 */
function resolverNacimiento(body, fechaIngreso) {
    const { fecha_nacimiento, Edada_Aprox } = body;
    if (fecha_nacimiento && moment(fecha_nacimiento, "YYYY-MM-DD", true).isValid()) {
        if (moment(fecha_nacimiento).isAfter(moment())) return { error: "La fecha de nacimiento no puede ser futura." };
        return { fecha_nacimiento, nacimiento_exacto: true };
    }
    const deducida = nacimientoDesdeEstimacion(Edada_Aprox, fechaIngreso || new Date());
    if (deducida) return { fecha_nacimiento: deducida, nacimiento_exacto: false };
    return null;
}

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
            const errMotivo = validarMotivo(estado, req.body.motivo_estado);
            if (errMotivo) {
                return res.status(400).json({ code: '001', message: errMotivo, data: null });
            }
            const nacimiento = resolverNacimiento(req.body, Fecha_Ingreso);
            if (nacimiento && nacimiento.error) {
                return res.status(400).json({ code: '001', message: nacimiento.error, data: null });
            }

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
                motivo_estado: req.body.motivo_estado || null,
                ...(nacimiento && !nacimiento.error ? nacimiento : {}),
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
                data: colitas ? conEdad(colitas.get()) : null
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

            // Antes solo se podian cambiar foto, estado, esterilizacion y
            // observaciones: un nombre mal escrito quedaba mal para siempre.
            // Ahora se puede corregir la ficha entera, y como cada cambio
            // queda sellado con quien y cuando, la correccion es trazable.
            const editables = ["nombre", "idtipoanimal", "idgenero", "tamano", "peso"];
            editables.forEach((campo) => {
                if (req.body[campo] !== undefined && String(req.body[campo]).trim() !== "") {
                    updates[campo] = req.body[campo];
                }
            });

            const { Fecha_Ingreso } = req.body;
            if (Fecha_Ingreso) {
                if (!moment(Fecha_Ingreso, "YYYY-MM-DD", true).isValid()) {
                    return res.status(400).json({ code: '001', message: 'Fecha de ingreso invalida.', data: null });
                }
                if (moment(Fecha_Ingreso).isAfter(moment())) {
                    return res.status(400).json({ code: '001', message: 'La fecha de ingreso no puede ser futura.', data: null });
                }
                updates.Fecha_Ingreso = Fecha_Ingreso;
            }

            // El motivo es obligatorio al pasar a un estado de salida. Se
            // valida contra el estado que va a quedar, no solo contra el que
            // llega en el formulario.
            const estadoFinal = estado || plan.estado;
            const motivoFinal = req.body.motivo_estado !== undefined
                ? req.body.motivo_estado
                : plan.motivo_estado;
            const errMotivo = validarMotivo(estadoFinal, motivoFinal);
            if (errMotivo) {
                return res.status(400).json({ code: '001', message: errMotivo, data: null });
            }
            if (req.body.motivo_estado !== undefined) {
                updates.motivo_estado = req.body.motivo_estado || null;
            }

            // Nacimiento: fecha exacta si la mandan, o la que implica la edad
            // estimada. Solo se toca si el formulario envio alguno de los dos.
            if (req.body.fecha_nacimiento !== undefined || req.body.Edada_Aprox !== undefined) {
                const nacimiento = resolverNacimiento(
                    req.body,
                    Fecha_Ingreso || plan.Fecha_Ingreso
                );
                if (nacimiento && nacimiento.error) {
                    return res.status(400).json({ code: '001', message: nacimiento.error, data: null });
                }
                if (nacimiento) {
                    updates.fecha_nacimiento = nacimiento.fecha_nacimiento;
                    updates.nacimiento_exacto = nacimiento.nacimiento_exacto;
                }
                if (req.body.Edada_Aprox !== undefined && String(req.body.Edada_Aprox).trim() !== "") {
                    updates.Edada_Aprox = req.body.Edada_Aprox;
                }
            }

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