import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "../services/incidents.service";

export class IncidentsController {
  constructor(private service: IncidentsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.getAll(req.query as any)); } catch (e) { next(e); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.getById(String(req.params.id), req.user!.id)); } catch (e) { next(e); }
  };

create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = req.body;
    const reporterName = req.user!.name; 
    const reporterId = req.user!.id;

    const result = await this.service.create({
      ...dto,
      reporter: reporterName,
      reporterId: reporterId
    }, reporterId);

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.service.update(String(req.params.id), req.body, req.user!.id)); } catch (e) { next(e); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try { await this.service.delete(String(req.params.id), req.user!.id); res.status(204).send(); } catch (e) { next(e); }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.getStats() }); } catch (e) { next(e); }
  };

  searchVulnerable = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.searchVulnerable(String(req.query.q ?? "")) }); } catch (e) { next(e); }
  };

  exportIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll({});
      res.setHeader("Content-Disposition", "attachment; filename=incidents_export.json");
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(data.items, null, 2));
    } catch (e) { next(e); }
  };

  importIncidents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Body must be an array" } });
      let importedCount = 0;
      for (const item of items) {
        try { await this.service.create(item, req.user!.id); importedCount++; }
        catch { console.warn("Skipped:", item?.tag); }
      }
      res.status(200).json({ message: `Успішно імпортовано ${importedCount} з ${items.length} інцидентів.` });
    } catch (e) { next(e); }
  };

  deleteReporter = async (req: Request, res: Response, next: NextFunction) => {
    try { await this.service.deleteReporter(String(req.params.id)); res.status(204).send(); } catch (e) { next(e); }
  };

  getThreatStatsByTag = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.getThreatStatsByTag(String(req.query.tag ?? "")) }); } catch (e) { next(e); }
  };

  getMostFrequent = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ data: await this.service.getMostFrequent() }); } catch (e) { next(e); }
  };
}