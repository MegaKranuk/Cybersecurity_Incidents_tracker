import { IncidentsService } from "./incidents.service";
import { IncidentsRepository } from "../repositories/incidents.repository";
import { ApiError } from "../errors/api-error";

describe("IncidentsService", () => {
  let service: IncidentsService;
  let repo: IncidentsRepository;

  beforeEach(() => {
    repo = new IncidentsRepository();
    service = new IncidentsService(repo);
  });


  it("should throw error if reporter is too short", () => {
    const badDto = { 
      date: "2026-03-03", 
      reporter: "Дур",
      comment: "Коментар понад 15 символів для проходження тесту", 
      criticality: "Середня критичність", 
      tag: "Фішинг" 
    };
    expect(() => service.create(badDto as any)).toThrow(ApiError);
  });

    it("should throw error for invalid criticality", () => {
    const badDto = { 
      date: "2026-03-03", 
      reporter: "Андрій", 
      comment: "Коментар понад 15 символів для проходження тесту", 
      criticality: "Ядерний рівень", 
      tag: "Фішинг" 
    };
    
    expect(() => service.create(badDto as any)).toThrow("Invalid request");
    });
  it("should throw 404 for non-existent id", () => {
    expect(() => service.getById("123")).toThrow(ApiError);
  });

  it("should return correct items per page", () => {
    service.create({ date: "2026-03-03", reporter: "Андрій Сергійович", comment: "Перший інцидент у системі", criticality: "Середня критичність", tag: "Фішинг" } as any);
    service.create({ date: "2026-03-03", reporter: "Андрій Сергійович", comment: "Другий інцидент у системі", criticality: "Середня критичність", tag: "DDoS" } as any);
    
    const result = service.getAll({ page: "1", pageSize: "1" });
    expect(result.items.length).toBe(1);
    expect(result.meta.totalItems).toBe(2);
  });

  it("should sort items by date", () => {
    service.create({ date: "2026-03-01", reporter: "Андрій Сергійович", comment: "Інцидент від першого числа", criticality: "Середня критичність", tag: "Фішинг" } as any);
    service.create({ date: "2026-03-03", reporter: "Андрій Сергійович", comment: "Інцидент від третього числа", criticality: "Середня критичність", tag: "Фішинг" } as any);
    
    const result = service.getAll({ sortBy: "date", sortDir: "desc" });
    expect(result.items[0].date).toBe("2026-03-03");
  });
});