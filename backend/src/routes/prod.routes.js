import express from "express";
const router = express.Router();
import * as prodController from "../controllers/prod.controller.js";

router.get("/:id", prodController.getProductById);   // GET /api/prod/:id
router.get("/", prodController.getProducts);         // GET /api/prod
router.post("/", prodController.createProducts);
router.put("/", prodController.updateProducts);

export default router;