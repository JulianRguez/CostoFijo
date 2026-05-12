import express from "express";
const router = express.Router();
import * as ventController from "../controllers/vent.controller.js";

router.get("/", ventController.getVentas);
router.post("/", ventController.createVentas);

// 🔥 CERRAR VENTA (antes del :id)
router.delete("/imagen", ventController.eliminarImagen);
router.put("/estado", ventController.cambioEstado);
router.put("/producto", ventController.actualizarPrdVenta);

router.put("/:id", ventController.updateVenta);

router.get("/resumen", ventController.getResumenVentas);
router.get("/detalle", ventController.getVentasDetalle);
router.get("/pagoEnImg", ventController.getVentasPagoCloudinary);

export default router;
