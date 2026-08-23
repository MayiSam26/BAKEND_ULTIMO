const { Op } = require("sequelize");
const moment = require("moment");
const tblingreso = require("../Entity/Ingresos");
const tblegreso = require("../Entity/Egreso");
const tbldonantes = require("../Entity/Donante");
const tbluser = require("../Entity/User");

// Auditoría de los módulos económicos: quién registró cada movimiento de
// dinero y a qué hora real lo hizo. Se apoya en creado_en/creado_por, que
// escribe el servidor al guardar (ver IngresoController y EgreseCotroller),
// no en la fecha del formulario, que el usuario puede cambiar.

function nombreUsuario(usuarios, iduser) {
    if (iduser == null) return null;
    const u = usuarios.find((x) => x.iduser === iduser);
    if (!u) return `Usuario #${iduser}`;
    const completo = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
    return completo || u.usuario || `Usuario #${iduser}`;
}

exports.getAuditoriaEconomica = async (req, res) => {
    try {
        const { desde, hasta, tipo } = req.body || {};

        // El rango se aplica sobre la hora real de guardado, que es lo que
        // interesa auditar.
        const rango = {};
        if (desde && moment(desde, "YYYY-MM-DD", true).isValid()) {
            rango[Op.gte] = moment(desde).startOf("day").toDate();
        }
        if (hasta && moment(hasta, "YYYY-MM-DD", true).isValid()) {
            rango[Op.lte] = moment(hasta).endOf("day").toDate();
        }
        const filtroFecha = Object.getOwnPropertySymbols(rango).length ? { creado_en: rango } : {};

        const pedirIngresos = !tipo || tipo === "Ingreso";
        const pedirEgresos = !tipo || tipo === "Egreso";

        const [ingresos, egresos] = await Promise.all([
            pedirIngresos ? tblingreso.findAll({ where: filtroFecha }) : [],
            pedirEgresos ? tblegreso.findAll({ where: filtroFecha }) : [],
        ]);

        const idsUsuario = [
            ...ingresos.map((i) => i.creado_por),
            ...egresos.map((e) => e.creado_por),
            ...egresos.map((e) => e.modificado_por),
        ].filter((v) => v != null);

        const [usuarios, donantes] = await Promise.all([
            idsUsuario.length
                ? tbluser.findAll({ where: { iduser: { [Op.in]: idsUsuario } } })
                : [],
            ingresos.length
                ? tbldonantes.findAll({
                      where: { iddonantes: { [Op.in]: ingresos.map((i) => i.iddonantes) } },
                  })
                : [],
        ]);
        const usuariosLimpios = usuarios.map((u) => u.get());
        const donantesLimpios = donantes.map((d) => d.get());

        const data = [
            ...ingresos.map((i) => ({
                tipo: "Ingreso",
                id: i.idtblingreso,
                detalle:
                    (donantesLimpios.find((d) => d.iddonantes === i.iddonantes) || {}).fullname ||
                    "Donante no registrado",
                monto: Number(i.monto || 0),
                fecha_declarada: i.fecha_registro,
                creado_en: i.creado_en,
                creado_por: nombreUsuario(usuariosLimpios, i.creado_por),
                modificado_en: null,
                modificado_por: null,
            })),
            ...egresos.map((e) => ({
                tipo: "Egreso",
                id: e.idregistroegreso,
                detalle: e.Descripcion || "Sin descripción",
                monto: Number(e.Monto || 0),
                fecha_declarada: e.fechato,
                creado_en: e.creado_en,
                creado_por: nombreUsuario(usuariosLimpios, e.creado_por),
                modificado_en: e.modificado_en,
                modificado_por: nombreUsuario(usuariosLimpios, e.modificado_por),
            })),
        ];

        // Lo más reciente primero. Los registros anteriores a la auditoría no
        // tienen creado_en: van al final, no se mezclan con los que sí.
        data.sort((a, b) => {
            if (!a.creado_en && !b.creado_en) return 0;
            if (!a.creado_en) return 1;
            if (!b.creado_en) return -1;
            return new Date(b.creado_en) - new Date(a.creado_en);
        });

        const conHuella = data.filter((d) => d.creado_en).length;

        res.json({
            code: "000",
            message: "success",
            data,
            resumen: {
                total: data.length,
                conHuella,
                sinHuella: data.length - conHuella,
                totalIngresos: data.filter((d) => d.tipo === "Ingreso").reduce((s, d) => s + d.monto, 0),
                totalEgresos: data.filter((d) => d.tipo === "Egreso").reduce((s, d) => s + d.monto, 0),
            },
        });
    } catch (error) {
        console.error("Error en getAuditoriaEconomica:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};
