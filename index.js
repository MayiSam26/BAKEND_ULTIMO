require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const conexion = require("./database/conection");

const router = require("./router");
const tipoPersona = require("./router/TipoPersona");
const redesSocial = require("./router/Redes/Index");
const genero = require("./router/Genero");
const planMensual = require("./router/Plan");
const amo = require("./router/Amos");
const planAnimal = require("./router/TipoAnimal");
const perdidos = require("./router/Perdidos");
const egreso = require("./router/Egreso/Index");
const donante = require("./router/Donante/Index");
const adoptantes = require("./router/Adoptantes");
const colitas = require("./router/Colitas");
const adopciones = require("./router/Adopciones");
const apadrinado = require("./router/Apadrinado");
const ingresos = require("./router/Ingresos/Index");

require("./Entity/User");
require("./Entity/TipoPersona");
require("./Entity/Genero");
require("./Entity/Plan");
require("./Entity/TipoAnimal");
require("./Entity/dueno");
require("./Entity/Perdidos");
require("./Entity/Redes");
require("./Entity/Egreso");
require("./Entity/Donante");
require("./Entity/Adoptantes");
require("./Entity/Colitas");
require("./Entity/Adopciones");
require("./Entity/Apadriando");
require("./Entity/Ingresos");
require("./Entity/Auditoria");

conexion
  .sync()
  .then(() => console.log("Conexion exitosa"))
  .catch((error) => console.log("Error de conexion: ", error));

const app = express();

/* ===========================
   ✅ CORS CONFIG (ESTABLE)
=========================== */
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "https://colitasyamor.netlify.app",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sin Origin (Postman, Railway health checks, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Importante: devuelve error para que sea claro (y no "silencioso")
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // ✅ ponlo en false si NO usas cookies/sesiones
    maxAge: 86400, // cachea preflight 24h
  })
);

// ✅ Maneja preflight para todas las rutas
app.options("*", cors());
/* =========================== */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", router());
app.use("/tipo-persona", tipoPersona());
app.use("/genero", genero());
app.use("/plan-mensual", planMensual());
app.use("/tipo-animal", planAnimal());
app.use("/amo", amo());
app.use("/perdidos", perdidos());
app.use("/redes-social", redesSocial());
app.use("/egreso", egreso());
app.use("/donante", donante());
app.use("/adoptante", adoptantes());
app.use("/colitas", colitas());
app.use("/adopciones", adopciones());
app.use("/apadrinado", apadrinado());
app.use("/ingresos", ingresos());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
