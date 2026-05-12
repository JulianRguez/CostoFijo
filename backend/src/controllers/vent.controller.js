import dotenv from "dotenv";
dotenv.config();
import Vent from "../models/vent.model.js";
import cloudinary from "cloudinary";
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  
});


function obtenerPublicId(url) {
  if (!url) return null;

  const limpia = url.substring(1); // quita F / X / P
  const partes = limpia.split("/upload/");
  if (partes.length < 2) return null;

  let publicId = partes[1].replace(/^v\d+\//, "");
  publicId = publicId.replace(/\.[^/.]+$/, "");

  return publicId;
}

/**
 * GET /ventas
 * Lista ventas (facturas)
 * - opcional: filtrar por cliente
 * - paginado
 * - NO devuelve productos (solo listado)
 */
export const getVentas = async (req, res) => {
  try {
    const { idClient, factura, pago, page = 1, limit = 20 } = req.query;

    const filtro = {};

    if (idClient) filtro.idClient = idClient;
    if (factura) filtro.factura = factura;
    if (pago) filtro.pago = pago; // 👈 ESTE ES EL CAMBIO CLAVE

    const ventas = await Vent.find(filtro)
      .sort({ fecha: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(ventas);

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener ventas",
      error: error.message
    });
  }
};

/**
 * POST /ventas
 * Crea UNA venta con varios productos
 */
export const createVentas = async (req, res) => {
  try {
    const {
      idClient,
      factura,
      fecha,
      pago = "efectivo",
      otrosCobros = 0,
      descuentos = 0,
      productos
    } = req.body;

    // Validaciones principales
    if (!idClient) {
      return res.status(400).json({ mensaje: "idClient es obligatorio" });
    }

    if (!factura) {
      return res.status(400).json({ mensaje: "factura es obligatoria" });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: "productos debe ser un arreglo con al menos un producto"
      });
    }

    // Validar productos
    for (const [i, prod] of productos.entries()) {
      if (!prod.idProd) {
        return res.status(400).json({
          mensaje: `Producto[${i}]: idProd es obligatorio`
        });
      }

      if (prod.cantidad == null || prod.cantidad <= 0) {
        return res.status(400).json({
          mensaje: `Producto[${i}]: cantidad inválida`
        });
      }

      if (prod.valor == null || prod.valor < 0) {
        return res.status(400).json({
          mensaje: `Producto[${i}]: valor inválido`
        });
      }
    }

    const venta = new Vent({
      idClient,
      factura,
      fecha,
      pago,
      otrosCobros,
      descuentos,
      productos
    });

    const creada = await venta.save();

    res.status(201).json(creada);

  } catch (error) {
    res.status(400).json({
      mensaje: "Error al crear la venta",
      error: error.message
    });
  }
};

/**
 * PUT /ventas/:id
 * Actualiza SOLO datos globales de la venta
 * (no productos)
 */
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = ["pago", "imgPago", "otrosCobros", "descuentos"];

    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        mensaje: "No hay campos válidos para actualizar"
      });
    }

    const ventaActualizada = await Vent.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!ventaActualizada) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }

    res.json(ventaActualizada);

  } catch (error) {
    res.status(400).json({
      mensaje: "Error al actualizar venta",
      error: error.message
    });
  }
};
export const getResumenVentas = async (req, res) => {
  try {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);

    if (!mes || !anio) {
      return res.status(400).json({
        mensaje: "mes y anio son obligatorios"
      });
    }

    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 1);

    const ventas = await Vent.find(
  {
    fecha: { $gte: inicio, $lt: fin },
    pago: { $in: ["efectivo", "aBanco"] }
  },
  { productos: 1 }
);

    const resumen = {};

    for (const venta of ventas) {
      for (const prod of venta.productos) {
        if (!prod.etiqueta) continue;

        if (!resumen[prod.etiqueta]) {
          resumen[prod.etiqueta] = 0;
        }

        resumen[prod.etiqueta] += prod.valor * prod.cantidad;
      }
    }

    const totalIngresos = Object.values(resumen).reduce(
      (acc, val) => acc + val,
      0
    );

    res.json({
      ingresosPorEtiqueta: resumen,
      totalIngresos
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al generar resumen",
      error: error.message
    });
  }
};
export const getVentasDetalle = async (req, res) => {
  try {
    const ventas = await Vent.find(
      {},
      {
        fecha: 1,
        factura: 1,
        productos: 1
      }
    );

    res.json(ventas);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener detalle de ventas",
      error: error.message
    });
  }
};
export const getVentasPagoCloudinary = async (req, res) => {
  try {
    const estadosActivos = [
      "Pedido Enviado",
      "Pago en verificación",
      "Pendiente de envío",
      "Esperando crédito",
      "Pago Aprobado",
      "Pedido Entregado",
      "Pagar al recibir",
      "Compra cancelada"
    ];

    const ventas = await Vent.find({
      pago: { $in: estadosActivos }
    }).sort({ fecha: -1 });

    res.json(ventas);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener ventas activas",
      error: error.message
    });
  }
};
export const eliminarImagen = async (req, res) => {
  try {
    const { _id, url } = req.body;

    if (!_id || !url) {
      return res.status(400).json({ msg: "Se requieren _id y url" });
    }

    const publicId = obtenerPublicId(url);

    if (!publicId) {
      return res.status(404).json({ msg: "no encontrado" });
    }

    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result === "not found") {
      return res.status(404).json({ msg: "no encontrado" });
    }

    const venta = await Vent.findByIdAndUpdate(
      _id,
      { imgPago: "" },
      { new: true }
    );

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    res.json({ msg: "Imagen eliminada correctamente", venta });
  } catch (error) {
    console.error("eliminarImagen:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};
export const cambioEstado = async (req, res) => {
  try {
    const { _id, nuevoEstado } = req.body;

    if (!_id || !nuevoEstado) {
      return res.status(400).json({ msg: "Se requieren _id y nuevoEstado" });
    }

    const venta = await Vent.findByIdAndUpdate(
      _id,
      { pago: nuevoEstado },
      { new: true }
    );

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    res.json({ msg: "Estado actualizado correctamente", venta });
  } catch (error) {
    console.error("cambioEstado:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};
export const actualizarPrdVenta = async (req, res) => {
  try {
    const { _id, idProd, cantidad, version } = req.body;

    if (!_id || !idProd) {
      return res.status(400).json({ msg: "Se requieren _id e idProd" });
    }

    const venta = await Vent.findById(_id);

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    const producto = venta.productos.find((p) => p.idProd === idProd);

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado en la venta" });
    }

    if (cantidad !== undefined) producto.cantidad = cantidad;
    if (version !== undefined) producto.version = version;

    await venta.save();

    res.json({ msg: "Producto actualizado correctamente", venta });
  } catch (error) {
    console.error("actualizarPrdVenta:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};
 