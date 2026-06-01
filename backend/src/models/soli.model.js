import mongoose from "mongoose";

const soliSchema = new mongoose.Schema({
  solicitud: { type: String, required: true }
});

export default mongoose.model("Soli", soliSchema, "soli");