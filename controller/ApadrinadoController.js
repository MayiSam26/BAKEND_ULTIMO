const tblapadrinado = require("../Entity/Apadrinado");
const tblanimal = require("../Entity/Colitas");
const { Op } = require("sequelize");
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");

async function joinApadrinados(apadrinados) {
    const idsAnimal = apadrinados.map(item => item.idanimal);

    const animales = await tblanimal.findAll({ where: { idanimal: { [Op.in]: idsAnimal } } });
    const animalesLimpios = animales.map(item => item.get());

    return apadrinados.map(item => ({
        ...item.get(),
        animal: animalesLimpios.find(a => a.idanimal === item.idanimal) ?? null,
    }));
}

exports.getApadrinados = async (req, res) => {
    try {
        const { idanimal, tipo_apadrinamiento, estado, busqueda } = req.body;

        let filters = {};

        if (idanimal) {
            filters.idanimal = idanimal;
        }
        if (tipo_apadrinamiento) {
            filters.tipo_apadrinamiento = tipo_apadrinamiento;
        }
        if (estado) {
            filters.estado = estado;
        }
        if (busqueda) {
            filters.padrino_nombre = { [Op.like]: `%${busqueda}%` };
        }

        const apadrinados = await tblapadrinado.findAll({
            where: filters,
            order: [["idapadrinado", "DESC"]],
        });

        const data = await joinApadrinados(apadrinados);

        res.json({ code: "000", message: "success", data });
    } catch (error) {
        console.error("Error en getApadrinados:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const id = req.params.id;
        const apadrinado = await tblapadrinado.findOne({ where: { idapadrinado: id } });

        if (!apadrinado) {
            return res.json({ code: "001", message: "No existe el apadrinamiento seleccionado", data: null });
        }

        const [data] = await joinApadrinados([apadrinado]);

        res.json({ code: "000", message: "success", data });
    } catch (error) {
        console.error("Error en getDetail:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.createApadrinado = async (req, res) => {
    try {
        const { idanimal, padrino_nombre, padrino_contacto, tipo_apadrinamiento, monto, fecha_registro, estado } = req.body;

        if (!idanimal || !padrino_nombre || !tipo_apadrinamiento || !fecha_registro) {
            return res.status(400).json({
                code: '001',
                message: 'Completa el animal, el nombre del padrino, el tipo de apadrinamiento y la fecha.',
                data: null,
            });
        }

        const animal = await tblanimal.findOne({ where: { idanimal } });
        if (!animal) {
            return res.status(400).json({ code: '001', message: 'El animal seleccionado no existe.', data: null });
        }

        const nuevo = new tblapadrinado({
            idanimal,
            padrino_nombre,
            padrino_contacto: padrino_contacto || null,
            tipo_apadrinamiento,
            monto: monto || null,
            fecha_registro,
            estado: estado || 'Activo',
            ...sellarCreacion(req),
        });

        await nuevo.save();

        res.json({ code: '000', message: 'Se registró correctamente', data: null });
    } catch (error) {
        console.error("Error en createApadrinado:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};

exports.updateApadrinado = async (req, res) => {
    try {
        const id = req.params.id;
        const existente = await tblapadrinado.findOne({ where: { idapadrinado: id } });

        if (!existente) {
            return res.json({ code: '001', message: 'No existe el apadrinamiento seleccionado', data: null });
        }

        const { idanimal, padrino_nombre, padrino_contacto, tipo_apadrinamiento, monto, fecha_registro, estado } = req.body;

        if (idanimal) {
            const animal = await tblanimal.findOne({ where: { idanimal } });
            if (!animal) {
                return res.status(400).json({ code: '001', message: 'El animal seleccionado no existe.', data: null });
            }
        }

        const updates = {};
        if (idanimal) updates.idanimal = idanimal;
        if (padrino_nombre) updates.padrino_nombre = padrino_nombre;
        if (padrino_contacto !== undefined) updates.padrino_contacto = padrino_contacto || null;
        if (tipo_apadrinamiento) updates.tipo_apadrinamiento = tipo_apadrinamiento;
        if (monto !== undefined) updates.monto = monto || null;
        if (fecha_registro) updates.fecha_registro = fecha_registro;
        if (estado) updates.estado = estado;

        await tblapadrinado.update(sellarModificacion(req, updates), { where: { idapadrinado: id } });

        res.json({ code: '000', message: 'Se actualizó correctamente', data: null });
    } catch (error) {
        console.error("Error en updateApadrinado:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};

exports.deleteApadrinado = async (req, res) => {
    try {
        const id = req.params.id;
        const existente = await tblapadrinado.findOne({ where: { idapadrinado: id } });

        if (!existente) {
            return res.json({ code: '001', message: 'No existe el apadrinamiento seleccionado', data: null });
        }

        await tblapadrinado.destroy({ where: { idapadrinado: id } });

        res.json({ code: '000', message: 'Se eliminó correctamente', data: null });
    } catch (error) {
        console.error("Error en deleteApadrinado:", error);
        res.status(500).json({ code: '001', message: 'Error en el servidor', data: null });
    }
};
