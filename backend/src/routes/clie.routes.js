// clie.routes.js
import express from "express";
const router = express.Router();
import * as clieController from "../controllers/clie.controller.js";

router.get("/cc/:doc", clieController.getClientByDoc); // GET /api/clie/:doc
router.get("/:dato", clieController.getClientByDato); // GET /api/clie/:Num o Mail
router.get("/", clieController.getClients);         // GET /api/clie
router.post("/", clieController.createClients);     // POST /api/clie
router.put("/", clieController.updateClients);      // PUT /api/clie

export default router;