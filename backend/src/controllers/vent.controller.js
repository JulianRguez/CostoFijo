import Vent from "../models/vent.model.js";

/**
 * GET /ventas
 * Lista ventas (facturas)
 * - opcional: filtrar por cliente
 * - paginado
 * - NO devuelve productos (solo listado)
 */
export const getVentas = async (req, res) => {
  try {
    const { idClient, page = 1, limit = 20 } = req.query;

    const filtro = idClient ? { idClient } : {};

    const ventas = await Vent.find(
      filtro,
      { productos: 0 } // no traer productos en listado
    )
      .sort({ fecha: -1 })
      .skip((Number(page) - 1) * Number(limit))
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

    const allowedFields = ["pago", "otrosCobros", "descuentos"];

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
      { fecha: { $gte: inicio, $lt: fin } },
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

