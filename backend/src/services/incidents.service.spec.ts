import { IncidentsService } from "./incidents.service";
import { IncidentsRepository } from "../repositories/incidents.repository";
import { ApiError } from "../errors/api-error";

const OWNER_ID = "user-001";

describe("IncidentsService", () => {
  let service: IncidentsService;
  let repo: IncidentsRepository;

  beforeEach(() => {
    repo = new IncidentsRepository();
    service = new IncidentsService(repo);
  });

  it("should throw error if reporter is too short", async () => {
    const badDto = { date: "2026-03-03", reporter: "Дур", comment: "Коментар понад 15 символів для проходження тесту", criticality: "Середня критичність", tag: "Фішинг" };
    await expect(service.create(badDto as any, OWNER_ID)).rejects.toThrow(ApiError);
  });

  it("should throw error for invalid criticality", async () => {
    const badDto = { date: "2026-03-03", reporter: "Андрій", comment: "Коментар понад 15 символів для проходження тесту", criticality: "Ядерний рівень", tag: "Фішинг" };
    await expect(service.create(badDto as any, OWNER_ID)).rejects.toThrow("Невалідний запит");
  });

  it("should throw 404 for non-existent id", async () => {
    jest.spyOn(repo, "findById").mockResolvedValue(null);
    await expect(service.getById("non-existent-id", OWNER_ID)).rejects.toThrow(ApiError);
    jest.restoreAllMocks();
  });

  it("should return correct items per page", async () => {
    jest.spyOn(repo, "findAll").mockResolvedValue([
      { date: "2026-03-03", reporter: "Андрій", tag: "Фішинг", criticality: "Середня критичність" },
      { date: "2026-03-03", reporter: "Андрій", tag: "DDoS",   criticality: "Середня критичність" },
    ] as any);
    const result = await service.getAll({ page: "1", pageSize: "1" });
    expect(result.items.length).toBe(1);
    expect(result.meta.totalItems).toBe(2);
    jest.restoreAllMocks();
  });

  it("should sort items by date desc", async () => {
    jest.spyOn(repo, "findAll").mockResolvedValue([
      { date: "2026-03-01", reporter: "Андрій Сергійович", tag: "Фішинг", criticality: "Середня критичність" },
      { date: "2026-05-05", reporter: "Андрій Сергійович", tag: "Фішинг", criticality: "Середня критичність" },
    ] as any);
    const result = await service.getAll({ sortBy: "date", sortDir: "desc" });
    expect(result.items[0].date).toBe("2026-05-05");
    jest.restoreAllMocks();
  });
});