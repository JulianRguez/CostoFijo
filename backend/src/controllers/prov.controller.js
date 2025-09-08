// prov.controller.js
import Prov from "../models/prov.model.js";

// GET: obtener todos los proveedores
export const getProviders = async (req, res) => {
  try {
    const providers = await Prov.find();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener proveedores", error });
  }
};

// POST: crear uno o varios proveedores
export const createProviders = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía uno o varios proveedores." });
    }

    const allowed = ["doc", "nombre", "dire", "tel", "mail", "tipoCuenta", "banco", "numCuenta"];

    const docs = payload.map((p) => {
      const doc = {};
      for (const k of allowed) {
        if (p[k] !== undefined) doc[k] = p[k];
      }
      return doc;
    });

    const creados = await Prov.insertMany(docs, { ordered: true });

    return res.status(201).json({
      total: creados.length,
      providers: creados
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al crear proveedores",
      error: error.message || error
    });
  }
};

// PUT: actualizar uno o varios proveedores
export const updateProviders = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({
        mensaje: "El body está vacío. Envía uno o varios proveedores para actualizar."
      });
    }

    const missingId = payload.find((p) => !p._id);
    if (missingId) {
      return res.status(400).json({
        mensaje: "Todos los proveedores a actualizar deben incluir su _id."
      });
    }

    const allowed = ["doc", "nombre", "dire", "tel", "mail", "tipoCuenta", "banco", "numCuenta"];

    const results = [];
    for (const p of payload) {
      const updateData = {};
      for (const k of allowed) {
        if (p[k] !== undefined) updateData[k] = p[k];
      }

      const updated = await Prov.findByIdAndUpdate(
        p._id,
        updateData,
        { new: true, runValidators: true }
      );

      if (updated) {
        results.push(updated);
      } else {
        results.push({ _id: p._id, error: "Proveedor no encontrado" });
      }
    }

    return res.status(200).json({
      total: results.length,
      providers: results
    });

  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar proveedores",
      error: error.message || error
    });
  }
};
