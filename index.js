require("dotenv").config();

// Railway no tiene salida IPv6: Node por defecto usa el orden "verbatim" de
// dns.lookup() (lo que devuelva el sistema, que en Railway trae IPv6
// primero), y conexiones salientes como el SMTP de Gmail terminan intentando
// una IP inalcanzable (ENETUNREACH) en vez de la IPv4 que sí funciona. Esto
// fuerza a todo el proceso a preferir IPv4 al resolver hostnames.
require("dns").setDefaultResultOrder("ipv4first");

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
const auditoriaRegistros = require("./router/AuditoriaRegistros");
const egreso = require("./router/Egreso/Index");
const donante = require("./router/Donante/Index");
const adoptantes = require("./router/Adoptantes");
const colitas = require("./router/Colitas");
const adopciones = require("./router/Adopciones");
const ingresos = require("./router/Ingresos/Index");
const seguimientos = require("./router/Seguimiento");
const entrevistas = require("./router/Entrevista");
const noticias = require("./router/Noticia");
const veterinaria = require("./router/Veterinaria");
const permisos = require("./router/Permiso");
const contacto = require("./router/Contacto");
const apadrinado = require("./router/Apadrinado");
const voluntarioVisita = require("./router/VoluntarioVisita");
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
require("./Entity/Entrevista");
require("./Entity/Noticia");
require("./Entity/Veterinaria");
require("./Entity/Permiso");
require("./Entity/Apadrinado");

conexion
  .sync()
  .then(() => console.log("Conexion exitosa"))
  .catch((error) => console.log("Error de conexion: ", error));

const app = express();

// Railway corre detrás de un proxy inverso; esto permite que el rate limiter
// identifique la IP real del cliente en vez de la del proxy
app.set('trust proxy', 1);

// No revelar el framework, y cabeceras básicas de seguridad. nosniff es
// especialmente importante porque /uploads sirve archivos subidos por
// usuarios: sin esta cabecera el navegador podría "adivinar" que un archivo
// es HTML/JS y ejecutarlo aunque el Content-Type diga otra cosa.
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  next();
});

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

// "/", "/plan-mensual", "/colitas", "/adopciones", "/noticias" y "/perdidos"
// manejan su propia mezcla de rutas públicas/protegidas internamente
app.use("/", router());
app.use("/plan-mensual", planMensual());
app.use("/colitas", colitas());
app.use("/adopciones", adopciones());
app.use("/noticias", noticias());
app.use("/perdidos", perdidos());

// el resto es exclusivo del panel admin
app.use("/tipo-persona", verifyToken, tipoPersona());
app.use("/genero", verifyToken, genero());
app.use("/tipo-animal", verifyToken, planAnimal());
app.use("/amo", verifyToken, amo());
app.use("/redes-social", verifyToken, redesSocial());
app.use("/egreso", verifyToken, egreso());
app.use("/donante", verifyToken, donante());
app.use("/adoptante", verifyToken, adoptantes());
app.use("/ingresos", verifyToken, ingresos());
app.use("/seguimientos", verifyToken, seguimientos());
app.use("/entrevistas", verifyToken, entrevistas());
app.use("/veterinaria", verifyToken, veterinaria());
app.use("/permisos", verifyToken, permisos());
app.use("/auditoria-registros", verifyToken, auditoriaRegistros());
app.use("/apadrinado", verifyToken, apadrinado());
app.use("/voluntario-visita", verifyToken, voluntarioVisita());
app.use("/contacto", contacto());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));