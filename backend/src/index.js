import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();

// ✅ CORS condicional: localhost en dev, mismo dominio en prod
const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
  credentials: true,
};
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

