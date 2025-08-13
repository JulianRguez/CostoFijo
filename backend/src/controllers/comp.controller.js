import Comp from "../models/comp.model.js";

// GET igual que antes
export const getCompras = async (req, res) => {
  const compras = await Comp.find();
  res.json(compras);
};

// POST: acepta {} o []
export const createCompras = async (req, res) => {
  try {
    // 1) Normalizar payload a array
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    // 2) Validaciones básicas
    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía una o varias compras." });
    }

    // 3) Whitelist + casteos ligeros (ajusta a tu schema)
    const allowed = ["idProd", "fecha", "cantidad", "valor", "factura", "registro", "devuelto"];
    const docs = payload.map((c) => {
      const doc = {};
      for (const k of allowed) {
        if (c[k] !== undefined) doc[k] = c[k];
      }
      // ejemplo de casteo de fecha si viene como string
      if (doc.fecha && !(doc.fecha instanceof Date)) {
        doc.fecha = new Date(doc.fecha);
      }
      return doc;
    });

    // 4) Insertar en lote (válido para 1 o N)
    const creadas = await Comp.insertMany(docs, {
      ordered: true,          // todo-o-nada
      // rawResult: false,    // opcional
    });

    // 5) Responder
    return res.status(201).json({
      total: creadas.length,
      compras: creadas,
    });
  } catch (error) {
    // Mongoose puede devolver errores de validación o E11000 de índices únicos, etc.
    return res.status(400).json({
      mensaje: "Error al crear compras",
      error: error.message || error,
    });
  }
};

// PUT igual que antes
export const updateCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { idProd, cantidad, valor, factura, registro, fecha, devuelto } = req.body;

    const compraActualizada = await Comp.findByIdAndUpdate(
      id,
      { idProd, cantidad, valor, factura, registro, fecha, devuelto },
      { new: true, runValidators: true } // recomendable para validar en updates
    );

    if (!compraActualizada) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.json(compraActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar compra", error: error.message });
  }
};
