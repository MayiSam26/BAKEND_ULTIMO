jest.mock("../../Entity/PushToken", () => ({ findAll: jest.fn(), destroy: jest.fn() }));
jest.mock("../../Entity/User", () => ({ findAll: jest.fn() }));
jest.mock("../../Entity/Permiso", () => ({ findAll: jest.fn() }));

const tblpushtoken = require("../../Entity/PushToken");
const { probar } = require("../PushController");
const { leerRecibos } = require("../../helpers/push");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/** Expo falso: tickets para /send y recibos para /getReceipts. */
function expoFalso({ ticket = { status: "ok", id: "t1" }, recibos = { t1: { status: "ok" } } } = {}) {
  return jest.fn(async (url) => ({
    ok: true,
    json: async () => (url.includes("getReceipts") ? { data: recibos } : { data: [ticket] }),
  }));
}

const req = { user: { iduser: 7 } };
beforeEach(() => jest.clearAllMocks());

describe("POST /push/prueba", () => {
  test("sin teléfonos registrados lo dice sin llamar a Expo", async () => {
    tblpushtoken.findAll.mockResolvedValue([]);
    const fetchImpl = expoFalso();
    const res = mockRes();
    await probar(req, res, { fetchImpl, espera: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "001", message: expect.stringMatching(/ningún teléfono/) });
  });

  test("enviada y entregada: 000", async () => {
    tblpushtoken.findAll.mockResolvedValue([{ token: "ExponentPushToken[a]" }]);
    const res = mockRes();
    await probar(req, res, { fetchImpl: expoFalso(), espera: 0 });
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "000", message: expect.stringMatching(/Enviada a 1 teléfono/) });
  });

  test("Firebase mal configurado aparece en los recibos y se explica", async () => {
    tblpushtoken.findAll.mockResolvedValue([{ token: "ExponentPushToken[a]" }]);
    const fetchImpl = expoFalso({ recibos: { t1: { status: "error", message: "Unable to retrieve the FCM server key", details: { error: "InvalidCredentials" } } } });
    const res = mockRes();
    await probar(req, res, { fetchImpl, espera: 0 });
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "001", message: expect.stringMatching(/InvalidCredentials/) });
  });

  test("ticket con error: se muestra el motivo de Expo", async () => {
    tblpushtoken.findAll.mockResolvedValue([{ token: "ExponentPushToken[a]" }]);
    const fetchImpl = expoFalso({ ticket: { status: "error", message: "The Expo push token is not valid", details: { error: "InvalidToken" } } });
    const res = mockRes();
    await probar(req, res, { fetchImpl, espera: 0 });
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "001", message: expect.stringMatching(/not valid/) });
  });
});

describe("leerRecibos", () => {
  test("solo devuelve los que fallaron", async () => {
    const fetchImpl = expoFalso({ recibos: { a: { status: "ok" }, b: { status: "error", message: "m", details: { error: "MessageRateExceeded" } } } });
    expect(await leerRecibos(["a", "b"], { fetchImpl })).toEqual(["MessageRateExceeded: m"]);
    expect(await leerRecibos([], { fetchImpl })).toEqual([]);
  });
});
