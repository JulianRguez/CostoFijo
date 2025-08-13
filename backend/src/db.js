// src/db.js
import mongoose from"mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar:", error);
    process.exit(1);
  }
};

export default connectDB;
