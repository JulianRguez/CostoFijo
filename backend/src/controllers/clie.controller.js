// clie.controller.js
import Clie from "../models/clie.model.js";

// GET: obtener todos los clientes
export const getClients = async (req, res) => {
  try {
    const clients = await Clie.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener clientes", error });
  }
};

// POST: crear uno o varios clientes
export const createClients = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía uno o varios clientes." });
    }

    const allowed = ["doc", "nombre", "dire", "tel", "mail", "porpagar"];

    const docs = payload.map((c) => {
      const doc = {};
      for (const k of allowed) {
        if (c[k] !== undefined) doc[k] = c[k];
      }
      return doc;
    });

    const creados = await Clie.insertMany(docs, { ordered: true });

    return res.status(201).json({
      total: creados.length,
      clients: creados
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al crear clientes",
      error: error.message || error
    });
  }
};

// PUT: actualizar uno o varios clientes
export const updateClients = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({
        mensaje: "El body está vacío. Envía uno o varios clientes para actualizar."
      });
    }

    const missingId = payload.find((c) => !c._id);
    if (missingId) {
      return res.status(400).json({
        mensaje: "Todos los clientes a actualizar deben incluir su _id."
      });
    }

    const allowed = ["doc", "nombre", "dire", "tel", "mail", "porpagar"];

    const results = [];
    for (const c of payload) {
      const updateData = {};
      for (const k of allowed) {
        if (c[k] !== undefined) updateData[k] = c[k];
      }

      const updated = await Clie.findByIdAndUpdate(
        c._id,
        updateData,
        { new: true, runValidators: true }
      );

      if (updated) {
        results.push(updated);
      } else {
        results.push({ _id: c._id, error: "Cliente no encontrado" });
      }
    }

    return res.status(200).json({
      total: results.length,
      clients: results
    });

  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar clientes",
      error: error.message || error
    });
  }
};
// GET: obtener cliente por documento
export const getClientByDoc = async (req, res) => {
  try {
    const { doc } = req.params;
    const cliente = await Clie.findOne({ doc: doc });

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al buscar cliente", error });
  }
};