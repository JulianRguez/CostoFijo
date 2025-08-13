//comp.model.js
import mongoose from "mongoose";

const compSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  idProd: { type: String, required: true },
  cantidad: { type: Number, required: true },
  valor: { type: Number, required: true },
  devuelto: { type: Boolean, default: false },
  factura: { type: String, default: "" },    
  registro: { type: String, default: "" }     
});

export default mongoose.model("Comp", compSchema, "comp");
