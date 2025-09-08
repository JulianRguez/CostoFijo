import express from "express";
const router = express.Router();
import * as credController from "../controllers/cred.controller.js";

router.get("/", credController.getCreditos);
router.post("/", credController.createCreditos);
router.put("/:id", credController.updateCredito);

export default router;
