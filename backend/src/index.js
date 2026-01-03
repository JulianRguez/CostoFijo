import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import Prod from "./models/prod.model.js";

dotenv.config();
connectDB();

const app = express();

// ✅ CORS condicional: localhost en dev, mismo dominio en prod
const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
  credentials: true,
};
// Organiza nombre
function limpiarNombreProducto(nombre = "") {
  const match = nombre.match(/\s([A-Z]{3})(\d{2})?$/);
  let descuento = null;
  if (match && match[2]) {
    descuento = parseInt(match[2], 10);  }
  const nombreLimpio = nombre.replace(/\s([A-Z]{3})(\d{2})?$/, "").trim();
  if (descuento) {
    return `${nombreLimpio} con ${descuento}% Off`;
  }
  return nombreLimpio;
}

app.use(cors(corsOptions));

app.use(express.json());

// Rutas API
import prodRoutes from "./routes/prod.routes.js";
import compRoutes from "./routes/comp.routes.js";
import ventRoutes from "./routes/vent.routes.js";
import provRoutes from "./routes/prov.routes.js";
import clieRoutes from "./routes/clie.routes.js";
import credRoutes from "./routes/cred.routes.js";
import sistRoutes from "./routes/sist.routes.js";

app.use("/api/prod", prodRoutes);
app.use("/api/comp", compRoutes);
app.use("/api/vent", ventRoutes);
app.use("/api/prov", provRoutes);
app.use("/api/clie", clieRoutes);
app.use("/api/cred", credRoutes);
app.use("/api/sist", sistRoutes);
app.get("/P:id", async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Prod.findById(id).lean();

    if (!producto) {
      return res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
    }

    const nombreParaRedes = limpiarNombreProducto(producto.nombre);
    const imagen = producto.urlFoto1 || "";

    const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Claro Servicios</title>

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="Claro Servicios" />
  <meta property="og:description" content="${nombreParaRedes}" />
  <meta property="og:image" content="${imagen}" />
  <meta property="og:url" content="${req.protocol}://${req.get("host")}${req.originalUrl}" />

  <!-- WhatsApp / Facebook -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <script>
    window.location.href = "/";
  </script>
</body>
</html>
    `;

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error(error);
    res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
  }
});


// Paths útiles
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Servir frontend en producción
// ...
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
  });
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});

