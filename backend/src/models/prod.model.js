//prod.model.js
import mongoose from "mongoose";

const prodSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ref: { type: String, required: true },
  etiqueta: { type: String },
  stock: { type: Number, required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String },
  urlFoto1: { type: String },
  urlFoto2: { type: String },
  urlFoto3: { type: String },
  urlFoto4: { type: String },
  reversado: { type: Number, default: 0 },
  calificacion: { type: [Number], default: [] }
});

  export default mongoose.model("Prod", prodSchema, "prod");