import Cred from "../models/cred.model.js";

export const getCreditos = async (req, res) => {
  const creditos = await Cred.find();
  res.json(creditos);
};

export const createCreditos = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía uno o varios créditos." });
    }

    const allowed = ["idClient", "monto", "plazo", "interes", "fecha", "pagado"];

    const docs = payload.map((credito) => {
      const doc = {};
      for (const key of allowed) {
        if (credito[key] !== undefined) {
          doc[key] = credito[key];
        }
      }
      if (doc.fecha && !(doc.fecha instanceof Date)) {
        doc.fecha = new Date(doc.fecha);
      }
      return doc;
    });

    const creados = await Cred.insertMany(docs, { ordered: true });

    return res.status(201).json({
      total: creados.length,
      creditos: creados
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al crear créditos",
      error: error.message || error
    });
  }
};

export const updateCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { idClient, monto, plazo, interes, fecha, pagado } = req.body;

    const creditoActualizado = await Cred.findByIdAndUpdate(
      id,
      { idClient, monto, plazo, interes, fecha, pagado },
      { new: true, runValidators: true }
    );

    if (!creditoActualizado) {
      return res.status(404).json({ mensaje: "Crédito no encontrado" });
    }

    res.json(creditoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar crédito", error: error.message });
  }
};
