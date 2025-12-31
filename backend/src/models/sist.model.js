import mongoose from "mongoose";

const sistemaSchema = new mongoose.Schema({
  codigo: { type: String },
  nombre: { type: String },
  dato: { type: String }
});

export default mongoose.model("Sist", sistemaSchema, "sist");