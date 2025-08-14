import express from "express";
const router = express.Router();
import * as prodController from "../controllers/prod.controller.js";

router.get("/", prodController.getProducts);
router.post("/", prodController.createProducts);
router.put("/", prodController.updateProducts); 

export default router;