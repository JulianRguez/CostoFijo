import path from 'path'
import { fileURLToPath } from 'url'
import express from "express";
import dotenv  from "dotenv";
import cors  from "cors"; 
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true               
}));

app.use(express.json());

import prodRoutes from "./routes/prod.routes.js";
import compRoutes from "./routes/comp.routes.js";
import ventRoutes from "./routes/vent.routes.js";

app.use("/api/prod", prodRoutes);
app.use("/api/comp", compRoutes);
app.use("/api/vent", ventRoutes);

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (process.env.NODE_ENV === 'production') {
  // Servir frontend desde /dist
  app.use(express.static(path.join(__dirname, '../dist')))

  // Redirigir cualquier ruta que no sea API a index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
