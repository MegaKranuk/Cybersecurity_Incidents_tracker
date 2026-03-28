import { ApiError } from "../errors/api-error";
import { IncidentsRepository } from "../repositories/incidents.repository";
import { CreateIncidentRequestDto, UpdateIncidentRequestDto, IncidentResponseDto } from "../dtos/incidents.dto";

interface IncidentQuery {
  tag?: string;
  criticality?: string;
  sortBy?: keyof IncidentResponseDto;
  sortDir?: "asc" | "desc";
  page?: string;
  pageSize?: string;
}

const allowedCriticality = [
  "Низька критичність",
  "Трохи критично",
  "Середня критичність",
  "Відчутна критичність",
  "Дуже критично",
];

export class IncidentsService {
  constructor(private repo: IncidentsRepository) {}

  async getAll(query: IncidentQuery) {
    let data = await this.repo.findAll();

    if (query.tag) {
      data = data.filter((i) => i.tag === query.tag);
    }

    if (query.criticality) {
      data = data.filter((i) => i.criticality === query.criticality);
    }

    if (query.sortBy) {
      const dir = query.sortDir === "desc" ? -1 : 1;
      const field = query.sortBy;
      
      data.sort((a, b) => {
        if (a[field] > b[field]) return dir;
        if (a[field] < b[field]) return -dir;
        return 0;
      });
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || data.length || 1;
    const start = (page - 1) * pageSize;
    const total = data.length;

    return {
      items: data.slice(start, start + pageSize),
      meta:{
        totalItems: total,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total/pageSize)
      }
    };
  }

  async getById(id: string) {
    const incident = await this.repo.findById(id);
    if (!incident) throw new ApiError(404, "NOT_FOUND", "Incident not found");
    return incident;
  }

  async create(dto: CreateIncidentRequestDto) {
    this.validate(dto);
    try {
      return await this.repo.create(dto);
    } catch (err: any) {
      if (err.message && err.message.includes("UNIQUE constraint")) {
        throw new ApiError(409, "CONFLICT", "Data conflict");
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateIncidentRequestDto) {
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new ApiError(404, "NOT_FOUND", "Incident not found");
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new ApiError(404, "NOT_FOUND", "Incident not found");
  }

  async getStats() {
    return await this.repo.getStats();
  }

  async searchVulnerable(q: string) {
    return await this.repo.searchVulnerable(q);
  }

  private validate(dto: CreateIncidentRequestDto) {
    const errors: string[] = [];

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