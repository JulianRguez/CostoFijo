import Prod from "../models/prod.model.js";

export const getProducts = async (req, res) => {
  try {
    const { etiqueta } = req.query;

    const filtro = etiqueta ? { etiqueta } : {};

    const productos = await Prod.find(filtro);

    res.json(productos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error obteniendo productos",
      error: error.message
    });
  }
};
export const updateMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const newMeta = req.body;

    if (!id) {
      return res.status(400).json({ mensaje: "Falta el id" });
    }

    const updated = await Prod.findByIdAndUpdate(
      id,
      { meta: newMeta },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(updated);

  } catch (error) {
    res.status(500).json({
      mensaje: "Error actualizando meta",
      error: error.message
    });
  }
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

// GET: obtener un producto por _id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ mensaje: "Falta el parámetro _id" });
    }

    const producto = await Prod.findById(id);

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    console.error("❌ Error al obtener producto:", error);
    res.status(500).json({ mensaje: "Error al obtener producto", error });
  }
};
// POST /api/prod/by-ids
export const getProductsByIds = async (req, res) => {
  try {
    const ids = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar un arreglo de _id de productos"
      });
    }

    const productos = await Prod.find({
      _id: { $in: ids }
    });

    res.json(productos);
  } catch (error) {
    console.error("Error obteniendo productos por ids", error);
    res.status(500).json({
      mensaje: "Error obteniendo productos",
      error: error.message || error
    });
  }
};
export const actualizarStock = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload.length) {
      return res.status(400).json({ msg: "El body está vacío" });
    }

    const resultados = [];

    for (const item of payload) {
      const { _id, accion, newStock, version } = item;

      if (!_id || accion === undefined || newStock === undefined || version === undefined) {
        resultados.push({ _id, error: "Faltan campos requeridos" });
        continue;
      }

      const producto = await Prod.findById(_id);

      if (!producto) {
        resultados.push({ _id, error: "Producto no encontrado" });
        continue;
      }

      // Actualizar stock general
      if (accion === 0) {
        producto.stock -= newStock;
      } else {
        producto.stock += newStock;
      }

      // Actualizar versión si viene
      if (version !== "") {
        const [nombreVersion, cantidadStr] = version.split("-");
        const cantidad = parseInt(cantidadStr, 10);

        let partes = producto.version.split("-");
        const idx = partes.indexOf(nombreVersion);

        if (idx === -1) {
          resultados.push({ _id, error: `Versión "${nombreVersion}" no encontrada` });
          continue;
        }

        let stockVersion = parseInt(partes[idx + 1], 10);
        partes[idx + 1] = accion === 0
          ? (stockVersion - cantidad).toString()
          : (stockVersion + cantidad).toString();

        producto.version = partes.join("-");
      }

      await producto.save();
      resultados.push({ _id, ok: true, stock: producto.stock, version: producto.version });
    }

    res.json({ total: resultados.length, resultados });
  } catch (error) {
    console.error("actualizarStock:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};