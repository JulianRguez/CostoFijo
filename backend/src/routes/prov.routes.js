// prov.routes.js
import express from "express";
const router = express.Router();
import * as provController from "../controllers/prov.controller.js";

router.get("/", provController.getProviders);    // GET /prov
router.post("/", provController.createProviders); // POST /prov
router.put("/", provController.updateProviders);  // PUT /prov

export default router;
