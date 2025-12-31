// clie.model.js
import mongoose from "mongoose";

const abonoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    valor: { type: Number, required: true },
  },
  { _id: false }
);

const porPagarSchema = new mongoose.Schema(
  {
    producto: { type: String, required: true },
    diaCredito: { type: String, required: true },
    proxPago: { type: Date, required: true },
    valor: { type: Number, required: true },
    abonos: { type: [abonoSchema], default: [] },
    clave: { type: String, required: true },
  },
  { _id: false }
);

// Subesquema para elementos del carrito
const carritoItemSchema = new mongoose.Schema(
  {
    productoId: { type: String, required: true },
    cantidad: { type: Number, default: 1 },
    version: { type: String, default: "" },
  },
  { _id: false }
);

const clieSchema = new mongoose.Schema({
  doc: { type: String, default: "" },
  nombre: { type: String, default: "" },
  dire: { type: String, default: "" },
  tel: { type: String, default: "" },
  mail: { type: String, default: "" },
  porpagar: { type: [porPagarSchema], default: [] },
  clave: { type: String, default: "" },
  favoritos: { type: [String], default: [] },     
  carrito: { type: [carritoItemSchema], default: [] },
  compras: { type: [String], default: [] },
});

export default mongoose.model("Clie", clieSchema, "clie");
