jest.mock("../../Entity/User", () => ({ findOne: jest.fn() }));

const bcrypt = require("bcrypt");
const tblUser = require("../../Entity/User");
const { sessionUser } = require("../UserController");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => console.log.mockRestore());

describe("POST /session-user", () => {
  test.each([[{}], [{ usuario: "", pass: "x" }], [{ usuario: "ana" }], [{ usuario: ["ana"], pass: "x" }], [undefined]])(
    "sin usuario o contraseña válidos avisa sin tocar la base (%p)",
    async (body) => {
      const res = mockRes();
      await sessionUser({ body }, res);
      expect(res.json.mock.calls[0][0]).toMatchObject({ code: "001", message: "Ingresa tu usuario y tu contraseña." });
      expect(tblUser.findOne).not.toHaveBeenCalled();
    }
  );

  test("usuario inexistente y contraseña mala dan el mismo mensaje", async () => {
    const hash = await bcrypt.hash("correcta", 4);
    tblUser.findOne.mockResolvedValueOnce(null);
    const noExiste = mockRes();
    await sessionUser({ body: { usuario: "fantasma", pass: "x" } }, noExiste);

    tblUser.findOne.mockResolvedValueOnce({ usuario: "ana", password: hash, activo: true });
    const claveMala = mockRes();
    await sessionUser({ body: { usuario: "ana", pass: "incorrecta" } }, claveMala);

    expect(noExiste.json.mock.calls[0][0]).toEqual(claveMala.json.mock.calls[0][0]);
    expect(noExiste.json.mock.calls[0][0]).toMatchObject({ code: "001", message: "Usuario o contraseña incorrectos" });
  });

  test("usuario inexistente también pasa por bcrypt (mismo tiempo)", async () => {
    const compare = jest.spyOn(bcrypt, "compare");
    tblUser.findOne.mockResolvedValueOnce(null);
    await sessionUser({ body: { usuario: "fantasma", pass: "x" } }, mockRes());
    expect(compare).toHaveBeenCalledTimes(1);
    compare.mockRestore();
  });
});
