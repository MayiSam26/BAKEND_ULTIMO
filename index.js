require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors"); // Usaremos esto para la seguridad

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
const ingresos = require("./router/Ingresos/Index");
const seguimientos = require("./router/Seguimiento");
const verifyToken = require("./middleware/auth");

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
require("./Entity/Ingresos");
require("./Entity/Auditoria");
require("./Entity/Seguimiento");

conexion
  .sync()
  .then(() => console.log("Conexion exitosa"))
  .catch((error) => console.log("Error de conexion: ", error));

const app = express();

// Railway corre detrás de un proxy inverso; esto permite que el rate limiter
// identifique la IP real del cliente en vez de la del proxy
app.set('trust proxy', 1);

/* ===========================
   SOLUCIÓN DEL PROBLEMA CORS
   =========================== */
app.use(cors({
  origin: [
    "http://localhost:3000",       // Tu frontend local
    "http://localhost:5173",       // Por si usas Vite local
    "https://gestionadminrefugio.netlify.app",
    //"https://mayudash2026.netlify.app",
    "https://colitasyamor.netlify.app" // Tu frontend en Netlify
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // Permite que las cookies/tokens viajen si es necesario
}));
/* =========================== */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// "/", "/plan-mensual", "/colitas" y "/adopciones" manejan su propia mezcla de rutas públicas/protegidas internamente
app.use("/", router());
app.use("/plan-mensual", planMensual());
app.use("/colitas", colitas());
app.use("/adopciones", adopciones());

// el resto es exclusivo del panel admin
app.use("/tipo-persona", verifyToken, tipoPersona());
app.use("/genero", verifyToken, genero());
app.use("/tipo-animal", verifyToken, planAnimal());
app.use("/amo", verifyToken, amo());
app.use("/perdidos", verifyToken, perdidos());
app.use("/redes-social", verifyToken, redesSocial());
app.use("/egreso", verifyToken, egreso());
app.use("/donante", verifyToken, donante());
app.use("/adoptante", verifyToken, adoptantes());
app.use("/ingresos", verifyToken, ingresos());
app.use("/seguimientos", verifyToken, seguimientos());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));