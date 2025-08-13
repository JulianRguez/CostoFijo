import express from "express";
const router = express.Router();
import * as prodController from "../controllers/prod.controller.js";

router.get("/", prodController.getProducts);
router.post("/", prodController.createProducts); // <- plural
router.put("/:id", prodController.updateProduct);

export default router;