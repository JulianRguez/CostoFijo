import Vent from "../models/vent.model.js";

export const getVentas = async (req, res) => {
  const ventas = await Vent.find();
  res.json(ventas);
};

export const createVentas = async (req, res) => {
  try {
    // 1) Normalizar el body a un array
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length === 0) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía una o varias ventas." });
    }

    // 2) Filtrar campos permitidos
    const allowed = ["idProd", "idClient", "cantidad", "valor", "factura", "fecha", "devuelto", "garantia","etiqueta"];

    const docs = payload.map((venta) => {
      const doc = {};
      for (const key of allowed) {
        if (venta[key] !== undefined) {
          doc[key] = venta[key];
        }
      }
      // Convertir fecha si viene como string
      if (doc.fecha && !(doc.fecha instanceof Date)) {
        doc.fecha = new Date(doc.fecha);
      }
      return doc;
    });

    // 3) Insertar en lote (funciona para 1 o más)
    const creadas = await Vent.insertMany(docs, { ordered: true });

    // 4) Responder con éxito
    return res.status(201).json({
      total: creadas.length,
      ventas: creadas
    });

  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al crear ventas",
      error: error.message || error
    });
  }
};

export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { idProd, idClient, cantidad, valor, garantia, factura, fecha, devuelto, etiqueta } = req.body;

    const ventaActualizada = await Vent.findByIdAndUpdate(
      id,
      { idProd, idClient, cantidad, valor, garantia, factura, fecha, devuelto,etiqueta },
      { new: true, runValidators: true }
    );

    if (!ventaActualizada) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    res.json(ventaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar venta", error: error.message });
  }
};
