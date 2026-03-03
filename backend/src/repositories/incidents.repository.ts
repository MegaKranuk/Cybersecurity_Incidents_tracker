import { v4 as uuid } from "uuid";
import { IncidentResponseDto } from "../dtos/incidents.dto";

export class IncidentsRepository {
  private incidents = new Map<string, IncidentResponseDto>();

  findAll() {
    return Array.from(this.incidents.values());
  }

  findById(id: string) {
    return this.incidents.get(id) || null;
  }

  create(data: Omit<IncidentResponseDto, "id">) {
    const incident: IncidentResponseDto = { id: uuid(), ...data };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  update(id: string, data: Partial<IncidentResponseDto>) {
    const existing = this.incidents.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };
    this.incidents.set(id, updated);
    return updated;
  }

  delete(id: string) {
    return this.incidents.delete(id);
  }
}