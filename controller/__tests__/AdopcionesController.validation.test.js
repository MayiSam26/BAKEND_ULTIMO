// Solo se prueban las ramas de validación de solicitarAdopcion, que
// retornan ANTES de tocar la base de datos (tblColitas.findOne, etc.) — así
// que no hace falta mockear Sequelize ni conectarse a Railway para esto.
const { solicitarAdopcion } = require("../AdopcionesController");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const datosValidos = {
    Nombre: "Maria",
    Apellido: "Fernandez",
    Dni: "12345678",
    Direccion: "Av. Siempre Viva 123",
    telefono: "987654321",
    Motivo: "Quiero darle un hogar",
    idanimal: 1,
};

describe("AdopcionesController.solicitarAdopcion — validación", () => {
    test.each([
        ["Nombre"],
        ["Apellido"],
        ["Dni"],
        ["Direccion"],
        ["telefono"],
        ["Motivo"],
        ["idanimal"],
    ])("responde 400 si falta %s", async (campo) => {
        const req = { body: { ...datosValidos, [campo]: undefined } };
        const res = mockRes();

        await solicitarAdopcion(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: "001", message: "Completa todos los campos para enviar tu solicitud." })
        );
    });

    test.each(["123", "abcdefgh", "123456789", ""])(
        "responde 400 si el DNI no son 8 dígitos numéricos (%s)",
        async (dniInvalido) => {
            const req = { body: { ...datosValidos, Dni: dniInvalido } };
            const res = mockRes();

            await solicitarAdopcion(req, res, jest.fn());

            // Un Dni vacío ("") ya cae en la validación de "campo faltante" antes
            // de llegar al regex — igual debe responder 400, solo que con el
            // mensaje de campos incompletos.
            expect(res.status).toHaveBeenCalledWith(400);
        }
    );

});

// Nota: a propósito NO se prueba el caso "datos válidos" hasta el final —
// eso ya requiere tblColitas.findOne(...), es decir, una consulta real a la
// base de datos de Railway. Esta suite se limita a las ramas de validación
// que retornan 400 antes de tocar la BD.
