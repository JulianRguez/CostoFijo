import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    idProd: { type: String, required: true },
    cantidad: { type: Number, required: true },
    valor: { type: Number, required: true },
    garantia: { type: Number, default: 0 },
    devuelto: { type: Boolean, default: false },
    etiqueta: { type: String }
  },
  { _id: false }
);

const ventSchema = new mongoose.Schema({
  idClient: { type: String, required: true },

  factura: { type: String, required: true },
  fecha: { type: Date, default: Date.now },

  pago: { type: String, default: "efectivo" },
  otrosCobros: { type: Number, default: 0 },
  descuentos: { type: Number, default: 0 },

  productos: {
    type: [productoSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  }
});

// índice clave para rendimiento
ventSchema.index({ idClient: 1, fecha: -1 });

export default mongoose.model("Vent", ventSchema, "vent");
