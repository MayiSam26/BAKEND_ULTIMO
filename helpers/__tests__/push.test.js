jest.mock("../../Entity/PushToken", () => ({ findAll: jest.fn(), destroy: jest.fn() }));
jest.mock("../../Entity/User", () => ({ findAll: jest.fn() }));
jest.mock("../../Entity/Permiso", () => ({ findAll: jest.fn() }));

const { Op } = require("sequelize");
const tblpushtoken = require("../../Entity/PushToken");
const tblUser = require("../../Entity/User");
const tblpermiso = require("../../Entity/Permiso");
const { esTokenExpo, usuariosQueVen, enviarPush } = require("../push");

const token = (n) => `ExponentPushToken[tel${n}]`;

beforeEach(() => jest.clearAllMocks());

describe("esTokenExpo", () => {
  test("acepta los dos formatos de Expo", () => {
    expect(esTokenExpo("ExponentPushToken[abc123]")).toBe(true);
    expect(esTokenExpo("ExpoPushToken[abc123]")).toBe(true);
  });
  test("rechaza lo demás", () => {
    for (const t of [undefined, null, "", "abc", "ExponentPushToken[]", "ExponentPushToken[a]extra", 42]) expect(esTokenExpo(t)).toBe(false);
  });
});

describe("usuariosQueVen", () => {
  test("Administrador siempre, y los roles con la sección visible", async () => {
    tblpermiso.findAll.mockResolvedValue([{ rol: "Voluntario" }]);
    tblUser.findAll.mockResolvedValue([{ iduser: 1 }, { iduser: 5 }]);
    expect(await usuariosQueVen("adopcion")).toEqual([1, 5]);
    expect(tblpermiso.findAll.mock.calls[0][0]).toEqual({ where: { seccion: "adopcion", visible: true } });
    const where = tblUser.findAll.mock.calls[0][0].where;
    expect(where.activo).toBe(true);
    expect(where.rol[Op.in]).toEqual(["Administrador", "Voluntario"]);
  });

  test("filtrando por roles, un rol sin permiso no entra", async () => {
    tblpermiso.findAll.mockResolvedValue([{ rol: "Voluntario" }]);
    tblUser.findAll.mockResolvedValue([{ iduser: 1 }]);
    await usuariosQueVen("veterinaria", { roles: ["Administrador", "Veterinario"] });
    expect(tblUser.findAll.mock.calls[0][0].where.rol[Op.in]).toEqual(["Administrador"]);
  });
});

describe("enviarPush", () => {
  test("sin usuarios o sin teléfonos no llama a Expo", async () => {
    const fetchImpl = jest.fn();
    expect(await enviarPush([], { titulo: "t", cuerpo: "c" }, { fetchImpl })).toEqual({ enviados: 0, invalidos: 0 });
    tblpushtoken.findAll.mockResolvedValue([]);
    expect(await enviarPush([1], { titulo: "t", cuerpo: "c" }, { fetchImpl })).toEqual({ enviados: 0, invalidos: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("manda de 100 en 100 y borra los teléfonos desinstalados", async () => {
    tblpushtoken.findAll.mockResolvedValue(Array.from({ length: 150 }, (_, i) => ({ token: token(i) })));
    const fetchImpl = jest.fn(async (url, init) => {
      const tanda = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          data: tanda.map((m) => (m.to === token(120) ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok", id: "x" })),
        }),
      };
    });
    const r = await enviarPush([1, 2], { titulo: "Hola", cuerpo: "Prueba", datos: { url: "/veterinaria" } }, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toHaveLength(100);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toHaveLength(50);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)[0]).toMatchObject({ title: "Hola", body: "Prueba", data: { url: "/veterinaria" }, channelId: "avisos" });
    expect(r).toEqual({ enviados: 149, invalidos: 1 });
    expect(tblpushtoken.destroy.mock.calls[0][0].where.token[Op.in]).toEqual([token(120)]);
  });

  test("si Expo no responde no lanza error", async () => {
    tblpushtoken.findAll.mockResolvedValue([{ token: token(1) }]);
    const errorConsola = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = jest.fn().mockRejectedValue(new Error("sin red"));
    await expect(enviarPush([1], { titulo: "t", cuerpo: "c" }, { fetchImpl })).resolves.toEqual({ enviados: 0, invalidos: 0 });
    errorConsola.mockRestore();
  });
});
