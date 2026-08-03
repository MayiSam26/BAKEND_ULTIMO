const tblmascotaperdida = require("../Entity/Perdidos");
const tbldueno = require("../Entity/dueno");
const tbltipoanimal = require("../Entity/TipoAnimal");
const tblgenero = require("../Entity/Genero");
const moment = require("moment");
const multer = require("multer");
const path = require("path");
const { Op } = require("sequelize");

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
}).single('foto');

async function joinPerdidos(perdidos) {
    const idsDueno = perdidos.map(item => item.iddueno);
    const idsTipoAnimal = perdidos.map(item => item.idtipoanimal);
    const idsGenero = perdidos.map(item => item.idgenero);

    const [duenos, tipos, generos] = await Promise.all([
        tbldueno.findAll({ where: { iddueno: { [Op.in]: idsDueno } } }),
        tbltipoanimal.findAll({ where: { idtipoanimal: { [Op.in]: idsTipoAnimal } } }),
        tblgenero.findAll({ where: { idgenero: { [Op.in]: idsGenero } } }),
    ]);

    const duenosLimpios = duenos.map(item => item.get());
    const tiposLimpios = tipos.map(item => item.get());
    const generosLimpios = generos.map(item => item.get());

    return perdidos.map(item => ({
        ...item.get(),
        dueno: duenosLimpios.find(d => d.iddueno === item.iddueno) ?? null,
        tipo: tiposLimpios.find(t => t.idtipoanimal === item.idtipoanimal) ?? null,
        genero: generosLimpios.find(g => g.idgenero === item.idgenero) ?? null,
    }));
}

exports.getPerdidos = async (req, res) => {
    try {
        const { nombreBusqueda, idTipoAnimalBusqueda, idGeneroBusqueda, statusBusqueda, fechaBusqueda } = req.body;

        let filters = {};

        if (nombreBusqueda) {
            filters.Nombre = { [Op.like]: `%${nombreBusqueda}%` };
        }
        if (idTipoAnimalBusqueda) {
            filters.idtipoanimal = idTipoAnimalBusqueda;
        }
        if (idGeneroBusqueda) {
            filters.idgenero = idGeneroBusqueda;
        }
        if (statusBusqueda) {
            filters.status = statusBusqueda;
        }
        if (fechaBusqueda && moment(fechaBusqueda, "YYYY-MM-DD", true).isValid()) {
            const fecha = moment(fechaBusqueda).format("YYYY-MM-DD");
            filters.Fecha_Extravio = {
                [Op.between]: [`${fecha} 00:00:00`, `${fecha} 23:59:59`],
            };
        }

        const perdidos = await tblmascotaperdida.findAll({
            where: filters,
            order: [["idmascotaperdida", "DESC"]],
        });

        const data = await joinPerdidos(perdidos);

        res.json({ code: "000", message: "success", data });
    } catch (error) {
        console.error("Error en getPerdidos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.getPerdidosTopfour = async (req, res) => {
    try {
        const perdidos = await tblmascotaperdida.findAll({
            order: [["idmascotaperdida", "DESC"]],
            limit: 4,
        });

        const data = await joinPerdidos(perdidos);

        res.json({ code: "000", message: "success", data });
    } catch (error) {
        console.error("Error en getPerdidosTopfour:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const id = req.params.id;
        const perdido = await tblmascotaperdida.findOne({ where: { idmascotaperdida: id } });

        if (!perdido) {
            return res.json({ code: "001", message: "No existe la mascota perdida seleccionada", data: null });
        }

        const [data] = await joinPerdidos([perdido]);

        res.json({ code: "000", message: "success", data });
    } catch (error) {
        console.error("Error en getDetail:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.createPerdidos = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    code: '001',
                    message: 'Error al subir el archivo ' + err.message,
                    data: null,
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    code: '001',
                    message: 'No se ha subido ninguna imagen',
                    data: null,
                });
            }

            const { iduser, iddueno, Nombre, Edad, idtipoanimal, idgenero, tamano, status, Observaciones, Fecha_Extravio } = req.body;

            if (!iddueno || !Nombre || !idtipoanimal || !idgenero || !tamano || !Observaciones || !Fecha_Extravio) {
                return res.status(400).json({
                    code: '001',
                    message: 'Completa todos los campos requeridos',
                    data: null,
                });
            }

            const nuevo = new tblmascotaperdida({
                iduser: iduser || null,
                iddueno,
                Nombre,
                foto: req.file.path,
                Edad,
                idtipoanimal,
                idgenero,
                tamano,
                status: status || 'P',
                Observaciones,
                Fecha_Extravio,
            });

            await nuevo.save();

            res.json({ code: '000', message: 'Se registró correctamente', data: null });
        });
    } catch (error) {
        console.error("Error en createPerdidos:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};

exports.updatePerdidos = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    code: '001',
                    message: 'Error al subir el archivo ' + err.message,
                    data: null,
                });
            }

            const id = req.params.id;
            const existente = await tblmascotaperdida.findOne({ where: { idmascotaperdida: id } });

            if (!existente) {
                return res.json({ code: '001', message: 'No existe la mascota perdida seleccionada', data: null });
            }

            const { iddueno, Nombre, Edad, idtipoanimal, idgenero, tamano, status, Observaciones, Fecha_Extravio } = req.body;

            const updates = {};
            if (iddueno) updates.iddueno = iddueno;
            if (Nombre) updates.Nombre = Nombre;
            if (Edad) updates.Edad = Edad;
            if (idtipoanimal) updates.idtipoanimal = idtipoanimal;
            if (idgenero) updates.idgenero = idgenero;
            if (tamano) updates.tamano = tamano;
            if (status) updates.status = status;
            if (Observaciones) updates.Observaciones = Observaciones;
            if (Fecha_Extravio) updates.Fecha_Extravio = Fecha_Extravio;
            if (req.file) updates.foto = req.file.path;

            await tblmascotaperdida.update(updates, { where: { idmascotaperdida: id } });

            res.json({ code: '000', message: 'Se actualizó correctamente', data: null });
        });
    } catch (error) {
        console.error("Error en updatePerdidos:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};

exports.deletePerdidos = async (req, res) => {
    try {
        const id = req.params.id;
        const existente = await tblmascotaperdida.findOne({ where: { idmascotaperdida: id } });

        if (!existente) {
            return res.json({ code: '001', message: 'No existe la mascota perdida seleccionada', data: null });
        }

        await tblmascotaperdida.destroy({ where: { idmascotaperdida: id } });

        res.json({ code: '000', message: 'Se eliminó correctamente', data: null });
    } catch (error) {
        console.error("Error en deletePerdidos:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};
