import express from "express";
import * as sistemaController from "../controllers/sist.controller.js";

const router = express.Router();

router.get("/", sistemaController.getSistemas);
router.get("/:codigo", sistemaController.getSistemaPorCodigo);
router.post("/", sistemaController.createSistemas);
router.put("/:codigo", sistemaController.updateSistema);

export default router;
