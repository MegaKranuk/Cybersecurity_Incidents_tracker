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

const ALLOWED_CRITICALITY = new Set([
  "Низька критичність",
  "Трохи критично",
  "Середня критичність",
  "Відчутна критичність",
  "Дуже критично",
]);

const ALLOWED_SORT_FIELDS = new Set<keyof IncidentResponseDto>([
  "date", "tag", "criticality", "reporter",
]);

export class IncidentsService {
  constructor(private repo: IncidentsRepository) {}

  async getAll(query: IncidentQuery) {
    let data = await this.repo.findAll();

    if (query.tag) {
      data = data.filter((i) => i.tag === query.tag);
    }

    if (query.criticality && ALLOWED_CRITICALITY.has(query.criticality)) {
      data = data.filter((i) => i.criticality === query.criticality);
    }

    if (query.sortBy && ALLOWED_SORT_FIELDS.has(query.sortBy)) {
      const dir = query.sortDir === "desc" ? -1 : 1;
      const field = query.sortBy;
      data.sort((a, b) => {
        if (a[field] > b[field]) return dir;
        if (a[field] < b[field]) return -dir;
        return 0;
      });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Number(query.pageSize) || data.length || 1;
    const start = (page - 1) * pageSize;
    const total = data.length;

    return {
      items: data.slice(start, start + pageSize),
      meta: { totalItems: total, currentPage: page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getById(id: string, ownerUserId: string) {
    const incident = await this.repo.findById(id, ownerUserId);
    if (!incident) throw new ApiError(404, "NOT_FOUND", "Інцидент не знайдено");
    return incident;
  }

  async create(dto: CreateIncidentRequestDto, ownerUserId: string) {
    this.validate(dto);
    try {
      return await this.repo.create(dto, ownerUserId);
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint")) throw new ApiError(409, "CONFLICT", "Конфлікт даних");
      throw err;
    }
  }

  async update(id: string, dto: UpdateIncidentRequestDto, ownerUserId: string) {
    const updated = await this.repo.update(id, dto, ownerUserId);
    if (!updated) throw new ApiError(404, "NOT_FOUND", "Інцидент не знайдено або доступ заборонено");
    return updated;
  }

  async delete(id: string, ownerUserId: string) {
    const deleted = await this.repo.delete(id, ownerUserId);
    if (!deleted) throw new ApiError(404, "NOT_FOUND", "Інцидент не знайдено або доступ заборонено");
  }

  async getStats() { return await this.repo.getStats(); }

  async searchVulnerable(q: string) { return await this.repo.searchVulnerable(q); }

  private validate(dto: CreateIncidentRequestDto) {
    const errors: string[] = [];
    if (!dto.date) errors.push("Поле date обов'язкове");
    if (!dto.reporter || dto.reporter.length < 5) errors.push("reporter: мінімум 5 символів");
    if (!dto.comment || dto.comment.length < 15) errors.push("comment: мінімум 15 символів");
    if (!ALLOWED_CRITICALITY.has(dto.criticality)) errors.push("Невалідне значення criticality");
    if (errors.length) throw new ApiError(400, "VALIDATION_ERROR", "Невалідний запит", errors);
  }

  async deleteReporter(id: string) {
    const deleted = await this.repo.deleteReporter(id);
    if (!deleted) throw new ApiError(404, "NOT_FOUND", "Репортера не знайдено");
  }

  async getThreatStatsByTag(tag: string) { return await this.repo.getThreatStatsByTag(tag); }

  async getMostFrequent() {
    const result = await this.repo.getMostFrequent();
    if (!result) throw new ApiError(404, "NOT_FOUND", "Мало даних");
    return result;
  }
}