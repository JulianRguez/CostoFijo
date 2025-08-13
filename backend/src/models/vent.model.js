import mongoose from "mongoose";

const ventSchema = new mongoose.Schema({
  idProd: { type: String, required: true },
  idClient: { type: String, required: true },
  cantidad: { type: Number, required: true },
  valor: { type: Number, required: true },
  factura:{type: String, required: true},
  fecha: { type: Date, default: Date.now },
  devuelto: { type: Boolean, default: false }
});

export default mongoose.model("Vent", ventSchema, "vent");
