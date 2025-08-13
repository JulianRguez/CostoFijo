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
      "descripcion",
      "urlFoto1",
      "urlFoto2",
      "urlFoto3",
      "urlFoto4",
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

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    const productoActualizado = await Prod.findByIdAndUpdate(id, datosActualizados, {
      new: true,
      runValidators: true
    });

    if (!productoActualizado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar producto", error });
  }
};
