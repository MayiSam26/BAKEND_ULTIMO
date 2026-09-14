const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-de-prueba";

// verifyToken consulta el estado actual del usuario: se simula la tabla.
jest.mock("../../Entity/User", () => ({ findOne: jest.fn() }));
const tblUser = require("../../Entity/User");

const { tokenAcceso, tokenRenovacion, validarRenovacion, huellaPassword } = require("../sesion");
const { olvidarUsuario } = require("../estadoUsuario");
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

/** Pasa el token por verifyToken y espera a que deje pasar o responda. */
function pasarPorAuth(token) {
  return new Promise((resolver) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn(() => resolver({ req, res, next }));
    res.json = jest.fn(() => {
      resolver({ req, res, next });
      return res;
    });
    verifyToken(req, res, next);
  });
}

beforeEach(() => {
  tblUser.findOne.mockReset();
  tblUser.findOne.mockResolvedValue(USUARIO);
  olvidarUsuario(USUARIO.iduser);
});

describe("tokens de la sesión", () => {
  test("el de acceso lleva el mismo contenido que el login de siempre, más la huella de la contraseña", () => {
    const decoded = jwt.verify(tokenAcceso(USUARIO), process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ iduser: 7, usuario: "ana", rol: "Voluntario", v: huellaPassword(USUARIO.password) });
    expect(decoded.purpose).toBeUndefined();
    expect(decoded.exp - decoded.iat).toBe(4 * 3600);
    expect(JSON.stringify(decoded)).not.toContain(USUARIO.password);
  });

  test("el de renovación dura 30 días y no lleva la contraseña", () => {
    const token = tokenRenovacion(USUARIO);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.exp - decoded.iat).toBe(30 * 24 * 3600);
    expect(token).not.toContain(USUARIO.password);
    expect(JSON.stringify(decoded)).not.toContain(USUARIO.password);
  });

  test("el de acceso pasa por el middleware", async () => {
    const { next, req } = await pasarPorAuth(tokenAcceso(USUARIO));
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.iduser).toBe(7);
  });

  test("el de renovación NO sirve como token de acceso", async () => {
    const { next, res } = await pasarPorAuth(tokenRenovacion(USUARIO));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("el de recuperar contraseña tampoco (como antes)", async () => {
    const reset = jwt.sign({ iduser: 7, purpose: "reset" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const { next } = await pasarPorAuth(reset);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("el token de acceso deja de valer al momento", () => {
  test("si el Administrador desactiva la cuenta", async () => {
    const token = tokenAcceso(USUARIO);
    tblUser.findOne.mockResolvedValue({ ...USUARIO, activo: false });
    const { next, res } = await pasarPorAuth(token);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toMatch(/desactivada/);
  });

  test("si la cuenta se borró", async () => {
    tblUser.findOne.mockResolvedValue(null);
    const { next } = await pasarPorAuth(tokenAcceso(USUARIO));
    expect(next).not.toHaveBeenCalled();
  });

  test("si cambió la contraseña", async () => {
    const token = tokenAcceso(USUARIO);
    tblUser.findOne.mockResolvedValue({ ...USUARIO, password: "$2b$12$otroHash" });
    const { res } = await pasarPorAuth(token);
    expect(res.json.mock.calls[0][0].message).toMatch(/contraseña cambió/);
  });

  test("si cambió el rol", async () => {
    const token = tokenAcceso(USUARIO);
    tblUser.findOne.mockResolvedValue({ ...USUARIO, rol: "Administrador" });
    const { res } = await pasarPorAuth(token);
    expect(res.json.mock.calls[0][0].message).toMatch(/rol cambió/);
  });

  test("un token viejo sin huella se sigue aceptando mientras la cuenta esté activa", async () => {
    const viejo = jwt.sign({ usuario: "ana", iduser: 7, rol: "Voluntario" }, process.env.JWT_SECRET, { expiresIn: "4h" });
    const { next } = await pasarPorAuth(viejo);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("se consulta la base una vez por minuto, y olvidarUsuario fuerza a mirar de nuevo", async () => {
    const token = tokenAcceso(USUARIO);
    await pasarPorAuth(token);
    await pasarPorAuth(token);
    expect(tblUser.findOne).toHaveBeenCalledTimes(1);
    tblUser.findOne.mockResolvedValue({ ...USUARIO, activo: false });
    olvidarUsuario(7);
    const { next } = await pasarPorAuth(token);
    expect(tblUser.findOne).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
  });

  test("si la base no responde no deja a nadie fuera", async () => {
    const errorConsola = jest.spyOn(console, "error").mockImplementation(() => {});
    tblUser.findOne.mockRejectedValue(new Error("ECONNREFUSED"));
    const { next } = await pasarPorAuth(tokenAcceso(USUARIO));
    expect(next).toHaveBeenCalledTimes(1);
    errorConsola.mockRestore();
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
