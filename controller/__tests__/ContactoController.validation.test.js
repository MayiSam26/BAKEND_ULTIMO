const { enviarConsultaDonacion } = require("../ContactoController");

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const datosValidos = {
    nombre: "Maria",
    correo: "maria@test.com",
    telefono: "987654321",
    mensaje: "Quisiera saber cómo donar",
};

describe("ContactoController.enviarConsultaDonacion — validación", () => {
    const envOriginal = { ...process.env };

    afterEach(() => {
        process.env = { ...envOriginal };
    });

    test.each(["nombre", "correo", "mensaje"])("responde 400 si falta %s", async (campo) => {
        const req = { body: { ...datosValidos, [campo]: undefined } };
        const res = mockRes();

        await enviarConsultaDonacion(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: "001", message: "Nombre, correo y mensaje son requeridos." })
        );
    });

    test.each(["no-es-un-correo", "falta-arroba.com", "@sin-usuario.com", "espacios en@correo.com"])(
        "responde 400 si el correo no tiene formato válido (%s)",
        async (correoInvalido) => {
            const req = { body: { ...datosValidos, correo: correoInvalido } };
            const res = mockRes();

            await enviarConsultaDonacion(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: "001", message: "Ingresa un correo electrónico válido." })
            );
        }
    );

    test("responde 500 controlado (no crashea) si faltan las variables de entorno de Resend", async () => {
        delete process.env.RESEND_API_KEY;
        delete process.env.EMAIL_DESTINO;
        const req = { body: datosValidos };
        const res = mockRes();

        await enviarConsultaDonacion(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: "001", message: "El envío de correo no está configurado en el servidor." })
        );
    });
});
