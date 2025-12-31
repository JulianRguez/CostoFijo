import Sist from "../models/sist.model.js";

// Obtener todos
export const getSistemas = async (req, res) => {
  try {
    const sistemas = await Sist.find();
    res.json(sistemas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener sistemas", error: error.message });
  }
};

// Obtener por código
export const getSistemaPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const sistema = await Sist.findOne({ codigo });

    if (!sistema) {
      return res.status(404).json({ mensaje: "Sistema no encontrado" });
    }

    res.json(sistema);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener sistema", error: error.message });
  }
};

// Crear uno o varios
export const createSistemas = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload.length) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía uno o varios sistemas." });
    }

    const allowed = ["codigo", "nombre", "dato"];
    const docs = payload.map((item) => {
      const doc = {};
      for (const key of allowed) {
        if (item[key] !== undefined) doc[key] = item[key];
      }
      return doc;
    });

    const creados = await Sist.insertMany(docs, { ordered: true });

    res.status(201).json({
      total: creados.length,
      sistemas: creados
    });
  } catch (error) {
    res.status(400).json({
      mensaje: "Error al crear sistemas",
      error: error.message
    });
  }
};

// Actualizar por código
export const updateSistema = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, dato } = req.body;

    const actualizado = await Sist.findOneAndUpdate(
      { codigo },
      { nombre, dato },
      { new: true, upsert: false }
    );

    if (!actualizado) {
      return res.status(404).json({ mensaje: "Sistema no encontrado" });
    }

    res.json(actualizado);
  } catch (error) {
    res.status(400).json({
      mensaje: "Error al actualizar sistema",
      error: error.message
    });
  }
};
