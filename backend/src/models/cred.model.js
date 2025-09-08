import mongoose from "mongoose";

const credSchema = new mongoose.Schema({
  idClient: { type: String, required: true },
  monto: { type: Number, required: true },
  plazo: { type: Number, required: true }, // en meses, por ejemplo
  interes: { type: Number, default: 0 },
  fecha: { type: Date, default: Date.now },
  pagado: { type: Boolean, default: false }
});

export default mongoose.model("Cred", credSchema, "cred");
