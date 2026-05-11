import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config";
import type {
  ApiError,
  CreateIncidentDto,
  IncidentListResponseDto,
  IncidentResponseDto,
  UpdateIncidentDto,
} from "./dtos";

const RETRY_STATUS = new Set([429, 503]);
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

/**
 * Універсальна функція запиту з підтримкою JWT та ретраїв
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  abortSignal?: AbortSignal,
  attempt = 0
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = abortSignal
    ? mergeSignals(abortSignal, controller.signal)
    : controller.signal;

  const headers = new Headers(options.headers || {});
  
  // Додаємо JWT токен, якщо він є у сховищі
  const token = localStorage.getItem("jwt_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  options.headers = headers;

  let response: Response;

  try {
    response = await fetch(url, { ...options, signal });
  } catch (e: unknown) {
    clearTimeout(timerId);
    const isAbort = e instanceof DOMException && e.name === "AbortError";
    throw {
      status: 0,
      code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      message: isAbort ? "Час очікування вичерпано" : "Помилка мережі",
      details: e instanceof Error ? e.message : String(e),
    } as ApiError;
  } finally {
    clearTimeout(timerId);
  }

  // Обробка 401 (Unauthorized) — сесія завершена
  if (response.status === 401) {
    localStorage.removeItem("jwt_token");
    // Подія для main.ts, щоб показати форму входу
    window.dispatchEvent(new Event("auth_failed"));
  }

  // Повторні спроби для безпечних запитів
  const method = (options.method ?? "GET").toUpperCase();
  if ((method === "GET") && RETRY_STATUS.has(response.status) && attempt < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, RETRY_BASE_DELAY_MS * Math.pow(2, attempt)));
    return request<T>(path, options, abortSignal, attempt + 1);
  }

  if (response.status === 204) return null as unknown as T;

  const rawText = await response.text();
  if (response.ok) {
    try { return JSON.parse(rawText) as T; } catch { return rawText as unknown as T; }
  }

  const payload = JSON.parse(rawText || "{}");
  throw {
    status: response.status,
    code: payload.error?.code || "HTTP_ERROR",
    message: payload.error?.message || `Помилка ${response.status}`,
    details: payload.error?.details || rawText,
  } as ApiError;
}

/** * API для автентифікації 
 */
export const authApi = {
  async login(name: string, passwordRaw: string) {
    const res = await request<{ token: string }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password: passwordRaw }),
    });
    localStorage.setItem("jwt_token", res.token);
    localStorage.setItem("user_name", name);
    return res;
  },

  async register(name: string, passwordRaw: string) {
    return request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password: passwordRaw }),
    });
  },

  logout() {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_name");
    window.location.reload();
  }
};

/** * API для інцидентів 
 */
export const getIncidents = (params: any, signal?: AbortSignal) => 
  request<IncidentListResponseDto>(`/incidents?${new URLSearchParams(params)}`, { method: "GET" }, signal);

export const createIncident = (dto: CreateIncidentDto) => 
  request<IncidentResponseDto>("/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

export const updateIncident = (id: string, dto: UpdateIncidentDto) => 
  request<IncidentResponseDto>(`/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

export const deleteReporter = (reporterId: string) => 
  request<void>(`/incidents/reporters/${reporterId}`, { method: "DELETE" });

export const getThreatStats = (tag: string) => 
  request<{ data: any[] }>(`/incidents/threat-stats?tag=${encodeURIComponent(tag)}`);

function mergeSignals(...signals: AbortSignal[]) {
  const c = new AbortController();
  signals.forEach(s => s.addEventListener("abort", () => c.abort(s.reason), { once: true }));
  return c.signal;
}