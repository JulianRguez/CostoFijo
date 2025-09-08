// prov.model.js
import mongoose from "mongoose";

const provSchema = new mongoose.Schema({
  doc: { type: String, required: true },
  nombre: { type: String, required: true },
  dire: { type: String },
  tel: { type: String },
  mail: { type: String },
  tipoCuenta: { type: String },
  banco: { type: String },
  numCuenta: { type: String },
});

export default mongoose.model("Prov", provSchema, "prov");
