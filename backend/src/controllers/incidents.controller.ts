import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "../services/incidents.service";

export class IncidentsController {
  constructor(private service: IncidentsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.getAll(req.query)); } catch (e) { next(e); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.getById(String(req.params.id))); } catch (e) { next(e); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json(await this.service.create(req.body)); } catch (e) { next(e); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.update(String(req.params.id), req.body)); } catch (e) { next(e); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try { 
      await this.service.delete(String(req.params.id)); 
      res.status(204).send(); 
    } catch (e) { next(e); }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.getStats() }); } catch (e) { next(e); }
  };

  searchVulnerable = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.searchVulnerable(String(req.query.q)) }); } catch (e) { next(e); }
  };
}