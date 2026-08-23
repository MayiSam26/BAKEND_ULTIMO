const { Op } = require("sequelize");
const moment = require("moment");
const tbluser = require("../Entity/User");

// Auditoría de registros: quién creó (o modificó por última vez) cada dato del
// sistema y a qué hora real lo hizo. Se apoya en creado_en/creado_por y
// modificado_en/modificado_por, que escribe el servidor al guardar (ver
// helpers/auditoria), no en las fechas del formulario, que el usuario puede
// cambiar.
//
// Cada módulo declara de qué tabla sale, cuál es su clave y cómo describir una
// fila en una línea. Agregar un módulo nuevo es sumar una entrada acá.
const MODULOS = [
  {
    clave: "Colitas",
    modelo: require("../Entity/Colitas"),
    id: "idanimal",
    describir: (r) => r.nombre || "Sin nombre",
    fechaDeclarada: "Fecha_Ingreso",
  },
  {
    clave: "Adoptantes",
    modelo: require("../Entity/Adoptantes"),
    id: "idadoptante",
    describir: (r) => [r.Nombre, r.Apellido].filter(Boolean).join(" ") || "Sin nombre",
    fechaDeclarada: "Fecha_Registro",
  },
  {
    clave: "Adopciones",
    modelo: require("../Entity/Adopciones"),
    id: "idadopcion",
    describir: (r) => `Adopción ${r.Estado || ""}`.trim(),
    fechaDeclarada: "Fecha_Adopcion",
  },
  {
    clave: "Apadrinamientos",
    modelo: require("../Entity/Apadrinado"),
    id: "idapadrinado",
    describir: (r) => `${r.padrino_nombre || "Padrino"} — ${r.tipo_apadrinamiento || ""}`.trim(),
    fechaDeclarada: "fecha_registro",
    monto: "monto",
  },
  {
    clave: "Donantes",
    modelo: require("../Entity/Donante"),
    id: "iddonantes",
    describir: (r) => r.fullname || "Sin nombre",
    fechaDeclarada: "Fecha_Registro",
  },
  {
    clave: "Ingresos",
    modelo: require("../Entity/Ingresos"),
    id: "idtblingreso",
    describir: (r) => `Donación ${r.donacion || ""} (${r.pago || "—"})`,
    fechaDeclarada: "fecha_registro",
    monto: "monto",
  },
  {
    clave: "Egresos",
    modelo: require("../Entity/Egreso"),
    id: "idregistroegreso",
    describir: (r) => r.Descripcion || "Sin descripción",
    fechaDeclarada: "fechato",
    monto: "Monto",
  },
  {
    clave: "Veterinaria",
    modelo: require("../Entity/Veterinaria"),
    id: "idveterinaria",
    describir: (r) => `${r.tipo || "Atención"} — ${r.descripcion || ""}`.trim(),
    fechaDeclarada: "fecha",
  },
  {
    clave: "Mascotas perdidas",
    modelo: require("../Entity/Perdidos"),
    id: "idmascotaperdida",
    describir: (r) => r.Nombre || "Sin nombre",
    fechaDeclarada: "Fecha_Extravio",
  },
  {
    clave: "Dueños",
    modelo: require("../Entity/dueno"),
    id: "iddueno",
    describir: (r) => r.nombre || "Sin nombre",
  },
  {
    clave: "Noticias",
    modelo: require("../Entity/Noticia"),
    id: "idnoticia",
    describir: (r) => r.titulo || "Sin título",
    fechaDeclarada: "fecha_publicacion",
  },
  {
    clave: "Seguimientos",
    modelo: require("../Entity/Seguimiento"),
    id: "idseguimiento",
    describir: (r) => `Seguimiento ${r.Tipo || ""}`.trim(),
    fechaDeclarada: "Fecha_Programada",
  },
  {
    clave: "Entrevistas",
    modelo: require("../Entity/Entrevista"),
    id: "identrevista",
    describir: (r) => `Entrevista ${r.Estado || ""}`.trim(),
    fechaDeclarada: "Fecha_Entrevista",
  },
  {
    clave: "Voluntariado",
    modelo: require("../Entity/VoluntarioVisita"),
    id: "idvisita",
    describir: (r) => r.nota || "Visita al refugio",
    fechaDeclarada: "fecha",
  },
];

// Los módulos que mueven dinero, para poder acotar el reporte a lo económico
// (que es donde más importa el control).
const MODULOS_ECONOMICOS = ["Ingresos", "Egresos", "Apadrinamientos"];

exports.getModulos = async (req, res) => {
    res.json({
        code: "000",
        message: "success",
        data: MODULOS.map((m) => ({ clave: m.clave, economico: MODULOS_ECONOMICOS.includes(m.clave) })),
    });
};

function nombreUsuario(usuarios, iduser) {
    if (iduser == null) return null;
    const u = usuarios.find((x) => x.iduser === iduser);
    if (!u) return `Usuario #${iduser}`;
    const completo = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
    return completo || u.usuario || `Usuario #${iduser}`;
}

exports.getAuditoriaRegistros = async (req, res) => {
    try {
        const { desde, hasta, modulo, soloEconomicos, soloModificados } = req.body || {};

        // El rango se aplica sobre la hora real de guardado, que es lo que
        // interesa auditar.
        const rango = {};
        if (desde && moment(desde, "YYYY-MM-DD", true).isValid()) {
            rango[Op.gte] = moment(desde).startOf("day").toDate();
        }
        if (hasta && moment(hasta, "YYYY-MM-DD", true).isValid()) {
            rango[Op.lte] = moment(hasta).endOf("day").toDate();
        }
        const hayRango = Object.getOwnPropertySymbols(rango).length > 0;

        const elegidos = MODULOS.filter((m) => {
            if (modulo && m.clave !== modulo) return false;
            if (soloEconomicos && !MODULOS_ECONOMICOS.includes(m.clave)) return false;
            return true;
        });

        const porModulo = await Promise.all(
            elegidos.map(async (m) => {
                // Con rango se filtra en la consulta; sin rango se trae todo para
                // poder mostrar también los registros sin huella (los anteriores
                // a la auditoría), que justamente conviene tener a la vista.
                const filas = await m.modelo.findAll(hayRango ? { where: { creado_en: rango } } : {});
                return filas.map((f) => {
                    const r = f.get();
                    return {
                        modulo: m.clave,
                        id: r[m.id],
                        detalle: m.describir(r),
                        monto: m.monto ? Number(r[m.monto] || 0) : null,
                        fecha_declarada: m.fechaDeclarada ? r[m.fechaDeclarada] || null : null,
                        creado_en: r.creado_en || null,
                        creado_por_id: r.creado_por != null ? r.creado_por : null,
                        modificado_en: r.modificado_en || null,
                        modificado_por_id: r.modificado_por != null ? r.modificado_por : null,
                    };
                });
            })
        );

        let data = porModulo.flat();
        if (soloModificados) data = data.filter((d) => d.modificado_en);

        const idsUsuario = [
            ...new Set(
                data.flatMap((d) => [d.creado_por_id, d.modificado_por_id]).filter((v) => v != null)
            ),
        ];
        const usuarios = idsUsuario.length
            ? (await tbluser.findAll({ where: { iduser: { [Op.in]: idsUsuario } } })).map((u) => u.get())
            : [];

        data = data.map(({ creado_por_id, modificado_por_id, ...resto }) => ({
            ...resto,
            creado_por: nombreUsuario(usuarios, creado_por_id),
            modificado_por: nombreUsuario(usuarios, modificado_por_id),
        }));

        // Lo más reciente primero. Los registros anteriores a la auditoría no
        // tienen creado_en: van al final, no se mezclan con los que sí.
        data.sort((a, b) => {
            if (!a.creado_en && !b.creado_en) return 0;
            if (!a.creado_en) return 1;
            if (!b.creado_en) return -1;
            return new Date(b.creado_en) - new Date(a.creado_en);
        });

        const conHuella = data.filter((d) => d.creado_en).length;
        const economicos = data.filter((d) => d.monto != null);

        res.json({
            code: "000",
            message: "success",
            data,
            resumen: {
                total: data.length,
                conHuella,
                sinHuella: data.length - conHuella,
                modificados: data.filter((d) => d.modificado_en).length,
                montoIngresos: economicos
                    .filter((d) => d.modulo !== "Egresos")
                    .reduce((s, d) => s + d.monto, 0),
                montoEgresos: economicos
                    .filter((d) => d.modulo === "Egresos")
                    .reduce((s, d) => s + d.monto, 0),
            },
        });
    } catch (error) {
        console.error("Error en getAuditoriaRegistros:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// Se mantiene el nombre anterior para no romper nada que ya lo llame.
exports.getAuditoriaEconomica = (req, res) => {
    req.body = { ...(req.body || {}), soloEconomicos: true };
    return exports.getAuditoriaRegistros(req, res);
};
