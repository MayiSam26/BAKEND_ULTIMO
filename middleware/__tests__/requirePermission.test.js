// Se mockea Entity/Permiso por completo (con una fábrica) para no cargar
// nunca el modelo real de Sequelize ni tocar la base de datos de Railway.
jest.mock("../../Entity/Permiso", () => ({
    findOne: jest.fn(),
}));

const tblpermiso = require("../../Entity/Permiso");
const requirePermission = require("../requirePermission");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("requirePermission", () => {
    beforeEach(() => {
        tblpermiso.findOne.mockReset();
    });

    test("deja pasar si el token no trae rol, sin consultar la BD", async () => {
        const req = { user: {} };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("colitas")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(tblpermiso.findOne).not.toHaveBeenCalled();
    });

    test("Administrador siempre pasa, sin consultar la BD", async () => {
        const req = { user: { rol: "Administrador" } };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("usuarios")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(tblpermiso.findOne).not.toHaveBeenCalled();
    });

    test("deja pasar si no existe fila para {rol, seccion} (sin restricción explícita)", async () => {
        tblpermiso.findOne.mockResolvedValue(null);
        const req = { user: { rol: "Voluntario" } };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("colitas")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("deja pasar si la fila existe y visible=true", async () => {
        tblpermiso.findOne.mockResolvedValue({ visible: true });
        const req = { user: { rol: "Voluntario" } };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("colitas")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("responde 403 si la fila existe y visible=false", async () => {
        tblpermiso.findOne.mockResolvedValue({ visible: false });
        const req = { user: { rol: "Voluntario" } };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("usuarios")(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("si la consulta falla, deja pasar (fail-open) en vez de romper", async () => {
        tblpermiso.findOne.mockRejectedValue(new Error("conexión caída"));
        const req = { user: { rol: "Voluntario" } };
        const res = mockRes();
        const next = jest.fn();

        await requirePermission("colitas")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
