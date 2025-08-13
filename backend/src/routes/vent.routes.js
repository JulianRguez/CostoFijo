import express from "express";
const router = express.Router();
import * as ventController from "../controllers/vent.controller.js";

router.get("/", ventController.getVentas);
router.post("/", ventController.createVentas); // ← usar la nueva función plural
router.put("/:id", ventController.updateVenta);

export default router;
