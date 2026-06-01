import Soli from "../models/soli.model.js";

// Obtener todas
export const getSolis = async (req, res) => {
  try {
    const solis = await Soli.find();
    res.json(solis);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener solicitudes", error: error.message });
  }
};

// Obtener por ID
export const getSoliPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const soli = await Soli.findById(id);

    if (!soli) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.json(soli);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener solicitud", error: error.message });
  }
};

// Crear una o varias
export const createSoli = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload.length) {
      return res.status(400).json({ mensaje: "El body está vacío. Envía una o varias solicitudes." });
    }

    for (const item of payload) {
      if (!item.solicitud || item.solicitud.trim() === "") {
        return res.status(400).json({ mensaje: "El campo 'solicitud' es obligatorio en todos los registros." });
      }
    }

    const docs = payload.map(({ solicitud }) => ({ solicitud }));
    const creadas = await Soli.insertMany(docs, { ordered: true });

    res.status(201).json({
      total: creadas.length,
      solis: creadas
    });
  } catch (error) {
    res.status(400).json({ mensaje: "Error al crear solicitudes", error: error.message });
  }
};

// Eliminar por ID
export const deleteSoli = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await Soli.findByIdAndDelete(id);

    if (!eliminada) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.json({ mensaje: "Solicitud eliminada correctamente", solicitud: eliminada });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar solicitud", error: error.message });
  }
};