import express from "express";
import * as soliController from "../controllers/soli.controller.js";

const router = express.Router();

router.get("/", soliController.getSolis);
router.get("/:id", soliController.getSoliPorId);
router.post("/", soliController.createSoli);
router.delete("/:id", soliController.deleteSoli);

export default router;