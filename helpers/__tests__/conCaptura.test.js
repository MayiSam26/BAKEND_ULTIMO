const { conCaptura } = require("../errorSubida");

function mockRes() {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn(() => {
    res.headersSent = true;
    return res;
  });
  return res;
}

const subidaFalsa = (err = null) => (req, res, cb) => cb(err);
const esperar = () => new Promise((ok) => setImmediate(ok));

beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => console.error.mockRestore());

describe("conCaptura", () => {
  test("un await que falla dentro del callback responde 500 en vez de dejar la promesa sin dueño", async () => {
    const res = mockRes();
    conCaptura(subidaFalsa())({}, res, async () => {
      throw new Error("notNull Violation: tblanimal.nombre cannot be null");
    });
    await esperar();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({ code: "001" });
  });

  test("un error síncrono también", () => {
    const res = mockRes();
    conCaptura(subidaFalsa())({}, res, () => {
      throw new Error("boom");
    });
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("si ya se respondió no intenta responder otra vez", async () => {
    const res = mockRes();
    conCaptura(subidaFalsa())({}, res, async () => {
      res.json({ code: "000" });
      throw new Error("después de responder");
    });
    await esperar();
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("pasa el error de multer al callback y lo que responde el callback se respeta", async () => {
    const res = mockRes();
    const errMulter = new Error("Solo se permiten imágenes");
    const cb = jest.fn(async (err) => res.status(400).json({ message: err.message }));
    conCaptura(subidaFalsa(errMulter))({}, res, cb);
    await esperar();
    expect(cb).toHaveBeenCalledWith(errMulter);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });
});
