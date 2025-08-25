import Prod from "../models/prod.model.js";

export const getProducts = async (req, res) => {
  const productos = await Prod.find();
  res.json(productos);
};

export const createProducts = async (req, res) => {
  try {
    // 1) Normalizar payload
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía uno o varios productos." });
    }

    // 2) Whitelist de campos permitidos
    const allowed = [
      "nombre",
      "ref",
      "etiqueta",
      "stock",
      "precio",
      "valorVenta",
      "minStock",
      "descripcion",
      "urlFoto1",
      "urlFoto2",
      "urlFoto3",
      "version",
      "reversado",
      "calificacion"
    ];

    const docs = payload.map((p) => {
      const doc = {};
      for (const k of allowed) {
        if (p[k] !== undefined) doc[k] = p[k];
      }
      return doc;
    });

    // 3) Insertar en lote (funciona para 1 o N)
    const creados = await Prod.insertMany(docs, { ordered: true });

    // 4) Respuesta
    return res.status(201).json({
      total: creados.length,
      productos: creados
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al crear productos",
      error: error.message || error
    });
  }
};

export const updateProducts = async (req, res) => {
  try {
    // 1) Normalizar payload a array
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({
        mensaje: "El body está vacío. Envía uno o varios productos para actualizar."
      });
    }

    // 2) Validar que todos tengan _id
    const missingId = payload.find((p) => !p._id);
    if (missingId) {
      return res.status(400).json({
        mensaje: "Todos los productos a actualizar deben incluir su _id."
      });
    }

    // 3) Campos permitidos para actualización
    const allowed = [
      "nombre",
      "ref",
      "etiqueta",
      "stock",
      "precio",
      "valorVenta",
      "minStock",
      "descripcion",
      "urlFoto1",
      "urlFoto2",
      "urlFoto3",
      "version",
      "reversado",
      "calificacion"
    ];

    // 4) Procesar actualizaciones
    const results = [];
    for (const p of payload) {
      const updateData = {};
      for (const k of allowed) {
        if (p[k] !== undefined) updateData[k] = p[k];
      }

      const updated = await Prod.findByIdAndUpdate(
        p._id,
        updateData,
        { new: true, runValidators: true }
      );

      if (updated) {
        results.push(updated);
      } else {
        results.push({ _id: p._id, error: "Producto no encontrado" });
      }
    }

    // 5) Respuesta
    return res.status(200).json({
      total: results.length,
      productos: results
    });

  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al actualizar productos",
      error: error.message || error
    });
  }
};

