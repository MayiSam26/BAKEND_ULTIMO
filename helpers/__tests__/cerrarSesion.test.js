const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-de-prueba";

jest.mock("../../Entity/SesionRevocada", () => ({ findAll: jest.fn(), upsert: jest.fn(), destroy: jest.fn() }));
jest.mock("../../Entity/User", () => ({ findOne: jest.fn() }));

const tblsesionrevocada = require("../../Entity/SesionRevocada");
const tblUser = require("../../Entity/User");
const { estaRevocada, revocar, recargar } = require("../sesionesRevocadas");
const { tokenAcceso, tokenRenovacion, validarRenovacion, nuevaSesionId } = require("../sesion");
const { olvidarUsuario } = require("../estadoUsuario");
const verifyToken = require("../../middleware/auth");
const { cerrarSesion } = require("../../controller/UserController");

const USUARIO = { iduser: 7, usuario: "ana", rol: "Voluntario", password: "$2b$12$hashDePrueba", activo: true };

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

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
  jest.clearAllMocks();
  tblsesionrevocada.upsert.mockResolvedValue();
  tblsesionrevocada.destroy.mockResolvedValue(0);
  tblsesionrevocada.findAll.mockResolvedValue([]);
  tblUser.findOne.mockResolvedValue(USUARIO);
  olvidarUsuario(7);
});

describe("identificador de sesión", () => {
  test("los dos tokens de un inicio de sesión llevan el mismo sid", () => {
    const sid = nuevaSesionId();
    expect(jwt.verify(tokenAcceso(USUARIO, sid), process.env.JWT_SECRET).sid).toBe(sid);
    expect(jwt.verify(tokenRenovacion(USUARIO, sid), process.env.JWT_SECRET).sid).toBe(sid);
    expect(nuevaSesionId()).not.toBe(sid);
  });

  test("renovar conserva el sid; un token viejo sin sid recibe uno nuevo", async () => {
    const sid = nuevaSesionId();
    const r = await validarRenovacion(tokenRenovacion(USUARIO, sid), async () => USUARIO);
    expect(r.sid).toBe(sid);
    const viejo = await validarRenovacion(tokenRenovacion(USUARIO), async () => USUARIO);
    expect(viejo.sid).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("sesiones revocadas", () => {
  test("revocar la anula hasta su vencimiento y lo guarda en la base", async () => {
    const ahora = Date.now();
    await revocar("s-1", 7, ahora + 60000, ahora);
    expect(estaRevocada("s-1", ahora)).toBe(true);
    expect(estaRevocada("s-1", ahora + 61000)).toBe(false);
    expect(estaRevocada(undefined)).toBe(false);
    expect(tblsesionrevocada.upsert).toHaveBeenCalledWith(expect.objectContaining({ sid: "s-1", iduser: 7 }));
    expect(tblsesionrevocada.destroy).toHaveBeenCalled();
  });

  test("un token ya vencido no se guarda", async () => {
    expect(await revocar("s-vieja", 7, Date.now() - 1000)).toBe(false);
    expect(tblsesionrevocada.upsert).not.toHaveBeenCalled();
  });

  test("al arrancar se leen de la tabla", async () => {
    tblsesionrevocada.findAll.mockResolvedValue([{ sid: "s-tabla", expira: new Date(Date.now() + 3600000) }]);
    await recargar();
    expect(estaRevocada("s-tabla")).toBe(true);
  });
});

describe("POST /session-logout", () => {
  test("anula la sesión: el token de acceso y el de renovación dejan de valer", async () => {
    const sid = nuevaSesionId();
    const acceso = tokenAcceso(USUARIO, sid);
    const renovacion = tokenRenovacion(USUARIO, sid);

    expect((await pasarPorAuth(acceso)).next).toHaveBeenCalled();

    const res = mockRes();
    await cerrarSesion({ headers: { authorization: `Bearer ${acceso}` }, body: { refreshToken: renovacion } }, res);
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "000" });
    // Se guarda hasta que habría vencido el de renovación (30 días), no el de acceso (4 h).
    const guardado = tblsesionrevocada.upsert.mock.calls[0][0];
    expect(guardado.sid).toBe(sid);
    expect(guardado.expira.getTime() - Date.now()).toBeGreaterThan(29 * 24 * 3600 * 1000);

    const { next, res: resAuth } = await pasarPorAuth(acceso);
    expect(next).not.toHaveBeenCalled();
    expect(resAuth.json.mock.calls[0][0].message).toMatch(/sesión se cerró/);

    const r = await validarRenovacion(renovacion, async () => USUARIO, { estaRevocada });
    expect(r.error).toMatch(/sesión se cerró/);
  });

  test("cerrar una sesión no afecta a otra del mismo usuario (otro teléfono)", async () => {
    const sidTelefono = nuevaSesionId();
    const sidPanel = nuevaSesionId();
    await cerrarSesion({ headers: {}, body: { refreshToken: tokenRenovacion(USUARIO, sidTelefono) } }, mockRes());
    expect((await pasarPorAuth(tokenAcceso(USUARIO, sidPanel))).next).toHaveBeenCalled();
  });

  test("tokens falsos, de recuperación o sin sid: responde igual y no guarda nada", async () => {
    const reset = jwt.sign({ iduser: 7, purpose: "reset", sid: "x" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    for (const body of [{}, { refreshToken: "basura" }, { refreshToken: reset }, { refreshToken: tokenRenovacion(USUARIO) }]) {
      const res = mockRes();
      await cerrarSesion({ headers: {}, body }, res);
      expect(res.json.mock.calls[0][0]).toMatchObject({ code: "000" });
    }
    const falso = jwt.sign({ iduser: 7, sid: "y" }, "otro-secreto");
    await cerrarSesion({ headers: { authorization: `Bearer ${falso}` }, body: {} }, mockRes());
    expect(tblsesionrevocada.upsert).not.toHaveBeenCalled();
  });

  test("se puede cerrar una sesión con el token de acceso ya vencido", async () => {
    const sid = nuevaSesionId();
    const vencido = jwt.sign({ iduser: 7, rol: "Voluntario", sid }, process.env.JWT_SECRET, { expiresIn: -10 });
    const renovacion = tokenRenovacion(USUARIO, sid);
    await cerrarSesion({ headers: { authorization: `Bearer ${vencido}` }, body: { refreshToken: renovacion } }, mockRes());
    expect(tblsesionrevocada.upsert.mock.calls[0][0].sid).toBe(sid);
  });
});
