// server.js
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================
// CORS
// =====================
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? true
      : "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// =====================
// UTILIDAD: LIMPIAR NOMBRE
// =====================
function limpiarNombreProducto(nombre = "") {
  const regex = /\s([A-Z]{3})(\d{2})?$/;
  const match = nombre.match(regex);

  let descuento = null;
  if (match && match[2]) {
    descuento = parseInt(match[2], 10);
  }

  const nombreLimpio = nombre.replace(regex, "").trim();
  if (descuento) {
    return `${nombreLimpio} con ${descuento}% Off`;
  }
  return nombreLimpio;
}

// =====================
// RUTA SOCIAL /p/:id
// =====================
// Sirve OG tags para bots y SPA para usuarios normales
app.get("/p/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ua = req.get("user-agent") || "";
    const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|Pinterest/i.test(
      ua
    );

    if (isBot) {
      // Obtenemos info del producto
      const producto = await Prod.findById(id).lean();
      if (!producto) return res.redirect("/");

      const nombreRedes = limpiarNombreProducto(producto.nombre);
      const imagen = producto.urlFoto1 || "";
      const urlFinal = `${req.protocol}://${req.get("host")}/p/${id}`;

      const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${nombreRedes}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${nombreRedes}" />
  <meta property="og:description" content="${producto.descripcion || nombreRedes}" />
  <meta property="og:image" content="${imagen}" />
  <meta property="og:url" content="${urlFinal}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${nombreRedes}" />
  <meta name="twitter:description" content="${producto.descripcion || nombreRedes}" />
  <meta name="twitter:image" content="${imagen}" />
</head>
<body></body>
</html>
      `;
      res.set("Content-Type", "text/html");
      return res.send(html);
    }

    // Usuario normal → SPA
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  } catch (error) {
    console.error("Error en /p/:id", error);
    res.redirect("/");
  }
});

// =====================
// RUTAS API
// =====================
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

// =====================
// FRONTEND (SPA)
// =====================
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  // ⚠️ CATCH-ALL AL FINAL
  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
  });
}

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});


