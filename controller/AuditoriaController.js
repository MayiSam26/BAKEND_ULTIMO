const { Op } = require("sequelize");
const moment = require("moment");
const btlauditoria = require("../Entity/Auditoria");

// Indicador "Tiempo de Registro" de la tesis, y Recomendación #2 del Cap. V
// ("reportes automáticos sobre el número de adopciones, tiempo de registro y
// donaciones").
//
// Cómo se mide: el formulario avisa cuando se abre (iniciarMedicion) y cuando
// se guarda (finalizarMedicion). Las dos marcas de tiempo las pone el
// servidor con su propio reloj — antes venían del navegador con un ajuste de
// zona horaria escrito a mano, que es fácil de desincronizar y de falsear.
//
// Antes el cronómetro arrancaba al iniciar sesión, así que medía la jornada
// entera y no el acto de registrar: por eso los pocos datos viejos dan cifras
// de horas. Esa medición quedó en la columna "resultado" (en minutos) como
// histórico; la nueva vive en "segundos" y es la única que lee el reporte.

// Un formulario abierto y olvidado no es un tiempo de registro. Pasado este
// límite la medición se descarta en vez de inflar el promedio.
const LIMITE_SEGUNDOS = 60 * 60;

exports.iniciarMedicion = async (req, res) => {
    try {
        const { modulo } = req.body || {};
        if (!modulo) {
            return res.status(400).json({ code: "001", message: "Falta el módulo.", data: null });
        }
        const fila = await btlauditoria.create({
            modulo,
            fechaInicio: new Date(),
            fechaRegistro: null,
            resultado: null,
            segundos: null,
        });
        res.json({ code: "000", message: "success", data: { idauditoria: fila.idauditoria } });
    } catch (error) {
        console.error("Error en iniciarMedicion:", error);
        res.status(500).json({ "Error server": error });
    }
};

exports.finalizarMedicion = async (req, res) => {
    try {
        const id = req.params.id;
        const fila = await btlauditoria.findOne({ where: { idauditoria: id } });
        if (!fila) {
            return res.json({ code: "001", message: "No existe código de auditoria", data: null });
        }
        // Si ya se cerró, no se vuelve a medir: evita que un reintento del
        // formulario pise el tiempo real con uno más largo.
        if (fila.segundos != null) {
            return res.json({ code: "000", message: "Ya estaba medido", data: null });
        }

        const fin = new Date();
        const inicio = new Date(fila.fechaInicio);
        const segundos = Math.round((fin.getTime() - inicio.getTime()) / 1000);

        await btlauditoria.update(
            {
                fechaRegistro: moment(fin).format("YYYY-MM-DD HH:mm:ss"),
                segundos: segundos >= 0 && segundos <= LIMITE_SEGUNDOS ? segundos : null,
            },
            { where: { idauditoria: id } }
        );

        res.json({ code: "000", message: "Se actualizó correctamente", data: null });
    } catch (error) {
        console.error("Error en finalizarMedicion:", error);
        res.status(500).json({ "Error server": error });
    }
};

function promedio(lista) {
    if (!lista.length) return null;
    return Math.round(lista.reduce((s, n) => s + n, 0) / lista.length);
}

exports.getReporteTiempos = async (req, res) => {
    try {
        const { desde, hasta } = req.body || {};
        const where = { segundos: { [Op.ne]: null } };
        if (desde && moment(desde, "YYYY-MM-DD", true).isValid()) {
            where.fechaInicio = { ...(where.fechaInicio || {}), [Op.gte]: moment(desde).startOf("day").toDate() };
        }
        if (hasta && moment(hasta, "YYYY-MM-DD", true).isValid()) {
            where.fechaInicio = { ...(where.fechaInicio || {}), [Op.lte]: moment(hasta).endOf("day").toDate() };
        }

        const filas = (await btlauditoria.findAll({ where })).map((f) => f.get());
        const todos = filas.map((f) => f.segundos);

        const modulos = [...new Set(filas.map((f) => f.modulo).filter(Boolean))].sort();
        const porModulo = modulos
            .map((m) => {
                const s = filas.filter((f) => f.modulo === m).map((f) => f.segundos);
                return { modulo: m, promedio: promedio(s), mediciones: s.length };
            })
            .sort((a, b) => b.mediciones - a.mediciones);

        // Evolución mes a mes, para ver si el tiempo de registro baja con el
        // uso, que es lo que la tesis quiere demostrar.
        const meses = [...new Set(filas.map((f) => moment(f.fechaInicio).format("YYYY-MM")))].sort();
        const porMes = meses.map((m) => {
            const s = filas
                .filter((f) => moment(f.fechaInicio).format("YYYY-MM") === m)
                .map((f) => f.segundos);
            return { mes: m, etiqueta: moment(m, "YYYY-MM").format("MMM YY"), promedio: promedio(s), mediciones: s.length };
        });

        res.json({
            code: "000",
            message: "success",
            data: {
                general: {
                    promedio: promedio(todos),
                    mediciones: todos.length,
                    minimo: todos.length ? Math.min(...todos) : null,
                    maximo: todos.length ? Math.max(...todos) : null,
                },
                porModulo,
                porMes,
            },
        });
    } catch (error) {
        console.error("Error en getReporteTiempos:", error);
        res.status(500).json({ "Error server": error });
    }
};

// Nombres anteriores, para no romper nada que todavía los llame.
exports.createAuditoria = exports.iniciarMedicion;
exports.updateAuditoria = exports.finalizarMedicion;
