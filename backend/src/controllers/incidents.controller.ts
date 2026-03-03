import { Request, Response } from "express";
import { IncidentsService } from "../services/incidents.service";
import { IncidentResponseDto } from "../dtos/incidents.dto";

export class IncidentsController {
  constructor(private service: IncidentsService) {}

  getAll = (req: Request, res: Response) => {
      const query = {
        tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
        criticality:
          typeof req.query.criticality === "string"
            ? req.query.criticality
            : undefined,
        sortBy:
          typeof req.query.sortBy === "string"
            ? (req.query.sortBy as keyof IncidentResponseDto)
            : undefined,
        sortDir:
          typeof req.query.sortDir === "string"
            ? (req.query.sortDir as "asc" | "desc")
            : undefined,
        page:
          typeof req.query.page === "string"
            ? req.query.page
            : undefined,
        pageSize:
          typeof req.query.pageSize === "string"
            ? req.query.pageSize
            : undefined,
      };

      res.json(this.service.getAll(query));
    };

  getById = (req: Request, res: Response) => {
    res.json(this.service.getById(String(req.params.id)));
  };

  create = (req: Request, res: Response) => {
    const created = this.service.create(req.body);
    res.status(201).json(created);
  };

  update = (req: Request, res: Response) => {
    res.json(this.service.update(String(req.params.id), req.body));
  };

  delete = (req: Request, res: Response) => {
    this.service.delete(String(req.params.id));
    res.status(204).send();
  };
}