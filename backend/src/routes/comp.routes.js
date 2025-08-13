import { Router } from "express";
import * as compraController from "../controllers/comp.controller.js";

const router = Router();

router.get("/", compraController.getCompras);
// Nota: cambiamos a createCompras (plural), mismo endpoint
router.post("/", compraController.createCompras);
router.put("/:id", compraController.updateCompra);

export default router;