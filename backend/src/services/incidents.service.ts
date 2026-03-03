import { ApiError } from "../errors/api-error";
import { IncidentsRepository } from "../repositories/incidents.repository";
import {
  CreateIncidentRequestDto,
  UpdateIncidentRequestDto,
} from "../dtos/incidents.dto";

const allowedCriticality = [
  "Низька критичність",
  "Трохи критично",
  "Середня критичність",
  "Відчутна критичність",
  "Дуже критично",
];

export class IncidentsService {
  constructor(private repo: IncidentsRepository) {}

  getAll(query: any) {
    let data = this.repo.findAll();

    if (query.tag) {
      data = data.filter((i) => i.tag === query.tag);
    }

    if (query.criticality) {
      data = data.filter((i) => i.criticality === query.criticality);
    }

    if (query.sortBy) {
      const dir = query.sortDir === "desc" ? -1 : 1;
      data.sort((a: any, b: any) =>
        a[query.sortBy] > b[query.sortBy] ? dir : -dir
      );
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || data.length;
    const start = (page - 1) * pageSize;

    return {
      items: data.slice(start, start + pageSize),
      total: data.length,
    };
  }

  getById(id: string) {
    const incident = this.repo.findById(id);
    if (!incident)
      throw new ApiError(404, "NOT_FOUND", "Incident not found");
    return incident;
  }

  create(dto: CreateIncidentRequestDto) {
    this.validate(dto);
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateIncidentRequestDto) {
    const updated = this.repo.update(id, dto);
    if (!updated)
      throw new ApiError(404, "NOT_FOUND", "Incident not found");
    return updated;
  }

  delete(id: string) {
    const deleted = this.repo.delete(id);
    if (!deleted)
      throw new ApiError(404, "NOT_FOUND", "Incident not found");
  }

  private validate(dto: CreateIncidentRequestDto) {
    const errors = [];

    if (!dto.date) errors.push("Date required");
    if (!dto.reporter || dto.reporter.length < 5)
      errors.push("Reporter min 5 chars");
    if (!dto.comment || dto.comment.length < 15)
      errors.push("Comment min 15 chars");
    if (!allowedCriticality.includes(dto.criticality))
      errors.push("Invalid criticality");

    if (errors.length)
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request", errors);
  }
}