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

  exportIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll({}); 

      res.setHeader('Content-disposition', 'attachment; filename=incidents_export.json');
      res.setHeader('Content-type', 'application/json');

      res.status(200).send(JSON.stringify(data.items, null, 2));
    } catch (e) { next(e); }
  };

  importIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: { message: "Body must be an array of JSON objects" } });
      }

      let importedCount = 0;
      for (const item of items) {
        try {
          await this.service.create(item);
          importedCount++;
        } catch (err) {
          console.warn("Skipped item during import:", item.tag);
        }
      }

      res.status(200).json({ 
        message: `Успішно імпортовано ${importedCount} з ${items.length} інцидентів.` 
      });
    } catch (e) { next(e); }
  };

  deleteReporter = async (req: Request, res: Response, next: NextFunction) => {
    try { 
      await this.service.deleteReporter(String(req.params.id)); 
      res.status(204).send(); 
    } catch (e) { next(e); }
  };

  getMostFrequent = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.getMostFrequent() }); } catch (e) { next(e); }
  };
}
