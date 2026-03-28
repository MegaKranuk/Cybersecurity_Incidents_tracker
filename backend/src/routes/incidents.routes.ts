import { Router } from "express";
import { IncidentsRepository } from "../repositories/incidents.repository";
import { IncidentsService } from "../services/incidents.service";
import { IncidentsController } from "../controllers/incidents.controller";

const router = Router();

const repo = new IncidentsRepository();
const service = new IncidentsService(repo);
const controller = new IncidentsController(service);

router.get("/", controller.getAll);
router.get("/stats", controller.getStats);
router.get("/search-vulnerable", controller.searchVulnerable); 
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;