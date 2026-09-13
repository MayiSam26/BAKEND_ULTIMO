const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-de-prueba";

const { tokenAcceso, tokenRenovacion, validarRenovacion, huellaPassword } = require("../sesion");
const verifyToken = require("../../middleware/auth");

// La app móvil mantiene la sesión con un token de renovación de 30 días. Lo
// que importa probar es que ese token NO sirva como token de acceso, y que
// deje de valer cuando cambia la contraseña o se desactiva la cuenta.

const USUARIO = { iduser: 7, usuario: "ana", rol: "Voluntario", password: "$2b$12$hashDePrueba", activo: true };

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function pasarPorAuth(token) {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  const next = jest.fn();
  verifyToken(req, res, next);
  return { req, res, next };
}

describe("tokens de la sesión", () => {
  test("el de acceso lleva el mismo contenido que el login de siempre", () => {
    const decoded = jwt.verify(tokenAcceso(USUARIO), process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ iduser: 7, usuario: "ana", rol: "Voluntario" });
    expect(decoded.purpose).toBeUndefined();
    expect(decoded.exp - decoded.iat).toBe(4 * 3600);
  });

  test("el de renovación dura 30 días y no lleva la contraseña", () => {
    const token = tokenRenovacion(USUARIO);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.exp - decoded.iat).toBe(30 * 24 * 3600);
    expect(token).not.toContain(USUARIO.password);
    expect(JSON.stringify(decoded)).not.toContain(USUARIO.password);
  });

  test("el de acceso pasa por el middleware", () => {
    const { next, req } = pasarPorAuth(tokenAcceso(USUARIO));
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.iduser).toBe(7);
  });

  test("el de renovación NO sirve como token de acceso", () => {
    const { next, res } = pasarPorAuth(tokenRenovacion(USUARIO));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("el de recuperar contraseña tampoco (como antes)", () => {
    const reset = jwt.sign({ iduser: 7, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const { next } = pasarPorAuth(reset);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("validarRenovacion", () => {
  const buscar = (user) => jest.fn().mockResolvedValue(user);

  test("un token vigente devuelve el usuario leído de la base", async () => {
    const actualizado = { ...USUARIO, rol: "Administrador" };
    const r = await validarRenovacion(tokenRenovacion(USUARIO), buscar(actualizado));
    expect(r.error).toBeUndefined();
    // El rol sale de la base, no del token: un cambio de rol se aplica al renovar.
    expect(r.user.rol).toBe("Administrador");
  });

  test("sin token", async () => {
    expect((await validarRenovacion(undefined, buscar(USUARIO))).error).toBeTruthy();
  });

  test("un token de acceso no sirve para renovar", async () => {
    const r = await validarRenovacion(tokenAcceso(USUARIO), buscar(USUARIO));
    expect(r.error).toMatch(/no válido/);
  });

  test("un token vencido", async () => {
    const vencido = jwt.sign(
      { iduser: 7, purpose: "refresh", v: huellaPassword(USUARIO.password) },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );
    expect((await validarRenovacion(vencido, buscar(USUARIO))).error).toMatch(/expiró/);
  });

  test("firmado con otro secreto", async () => {
    const falso = jwt.sign({ iduser: 7, purpose: "refresh", v: huellaPassword(USUARIO.password) }, "otro");
    expect((await validarRenovacion(falso, buscar(USUARIO))).error).toBeTruthy();
  });

  test("cambiar la contraseña invalida los tokens de renovación anteriores", async () => {
    const token = tokenRenovacion(USUARIO);
    const r = await validarRenovacion(token, buscar({ ...USUARIO, password: "$2b$12$otroHash" }));
    expect(r.error).toMatch(/contraseña cambió/);
  });

  test("una cuenta desactivada no renueva", async () => {
    const r = await validarRenovacion(tokenRenovacion(USUARIO), buscar({ ...USUARIO, activo: false }));
    expect(r.error).toMatch(/desactivada/);
  });

  test("un usuario borrado no renueva", async () => {
    const r = await validarRenovacion(tokenRenovacion(USUARIO), buscar(null));
    expect(r.error).toBeTruthy();
  });
});
