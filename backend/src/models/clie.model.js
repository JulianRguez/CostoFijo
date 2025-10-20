// clie.model.js
import mongoose from "mongoose";

const abonoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    valor: { type: Number, required: true },
  },
  { _id: false } // para que no cree un _id en cada abono
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
  { _id: false } // para que no cree un _id en cada objeto porpagar
);

const clieSchema = new mongoose.Schema({
  doc: { type: String, required: true },
  nombre: { type: String, required: true },
  dire: { type: String },
  tel: { type: String },
  mail: { type: String },
  porpagar: { type: [porPagarSchema], default: [] }, // arreglo de objetos
  clave: { type: String, default: "" },
});

export default mongoose.model("Clie", clieSchema, "clie");
