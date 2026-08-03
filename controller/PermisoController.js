const tblpermiso = require("../Entity/Permiso");

// Mismo trío de roles que valida UserController (CU17/CU18) - "Administrador"
// nunca tiene fila propia acá porque siempre tiene acceso total.
const ROLES_CONFIGURABLES = ["Voluntario", "Veterinario"];
// Debe reflejar exactamente las claves "key" de las secciones configurables
// en Navar.tsx (dashboard). "usuarios" queda afuera a propósito: darle ese
// acceso a otro rol permitiría crear cuentas Administrador.
const SECCIONES_CONFIGURABLES = [
    "refugio",
    "colitas",
    "perdidos",
    "veterinaria",
    "adopcion",
    "donaciones",
    "reportes",
];

exports.getPermisos = async (req, res) => {
    try {
        const filas = await tblpermiso.findAll();
        const mapa = new Map(filas.map((f) => [`${f.rol}|${f.seccion}`, f.visible]));

        const matriz = [];
        ROLES_CONFIGURABLES.forEach((rol) => {
            SECCIONES_CONFIGURABLES.forEach((seccion) => {
                matriz.push({
                    rol,
                    seccion,
                    visible: mapa.get(`${rol}|${seccion}`) ?? false,
                });
            });
        });

        res.json({ code: "000", message: "success", data: matriz });
    } catch (error) {
        console.error("Error en getPermisos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.getMisPermisos = async (req, res) => {
    try {
        const rol = req.user && req.user.rol;

        if (!rol || rol === "Administrador") {
            return res.json({ code: "000", message: "success", data: SECCIONES_CONFIGURABLES });
        }

        const filas = await tblpermiso.findAll({ where: { rol, visible: true } });
        const secciones = filas.map((f) => f.seccion);

        res.json({ code: "000", message: "success", data: secciones });
    } catch (error) {
        console.error("Error en getMisPermisos:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.updatePermisos = async (req, res) => {
    try {
        const { permisos } = req.body;

        if (!Array.isArray(permisos)) {
            return res.status(400).json({ code: "001", message: "Formato inválido", data: null });
        }

        for (const item of permisos) {
            const { rol, seccion, visible } = item;
            if (!ROLES_CONFIGURABLES.includes(rol) || !SECCIONES_CONFIGURABLES.includes(seccion)) {
                continue;
            }
            const existente = await tblpermiso.findOne({ where: { rol, seccion } });
            if (existente) {
                await tblpermiso.update({ visible: !!visible }, { where: { rol, seccion } });
            } else {
                await new tblpermiso({ rol, seccion, visible: !!visible }).save();
            }
        }

        res.json({ code: "000", message: "Se guardaron los permisos correctamente", data: null });
    } catch (error) {
        console.error("Error en updatePermisos:", error);
        res.status(500).json({ code: "001", message: "Error en el servidor", data: null });
    }
};
