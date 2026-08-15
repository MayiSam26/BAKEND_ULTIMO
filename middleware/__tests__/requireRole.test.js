const requireRole = require("../requireRole");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("requireRole", () => {
    test("deja pasar si el token no trae rol (sesiones viejas)", () => {
        const req = { user: {} };
        const res = mockRes();
        const next = jest.fn();

        requireRole("Administrador")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("deja pasar si el rol está en la lista permitida", () => {
        const req = { user: { rol: "Administrador" } };
        const res = mockRes();
        const next = jest.fn();

        requireRole("Administrador", "Voluntario")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("responde 403 si el rol no está permitido", () => {
        const req = { user: { rol: "Veterinario" } };
        const res = mockRes();
        const next = jest.fn();

        requireRole("Administrador")(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            code: "001",
            message: "No tienes permisos para acceder a esta función.",
            data: null,
        });
    });
});
