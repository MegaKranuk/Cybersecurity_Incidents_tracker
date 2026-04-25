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

  let response: Response;

  try {
    response = await fetch(url, { ...options, signal });
  } catch (e: unknown) {
    clearTimeout(timerId);
    const isAbort = e instanceof DOMException && e.name === "AbortError";
    const err: ApiError = {
      status: 0,
      code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      message: isAbort
        ? `Запит перевищив ліміт часу (${REQUEST_TIMEOUT_MS / 1000} с)`
        : "Помилка мережі або CORS — перевірте, чи запущений сервер",
      details: e instanceof Error ? e.message : String(e),
    };
    throw err;
  } finally {
    clearTimeout(timerId);
  }

  const method = (options.method ?? "GET").toUpperCase();
  const isSafe = method === "GET" || method === "HEAD";

  if (isSafe && RETRY_STATUS.has(response.status) && attempt < MAX_RETRIES) {
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
    await sleep(delay);
    return request<T>(path, options, abortSignal, attempt + 1);
  }
  if (response.status === 204) {
    if (!response.ok) {
      throw makeErr(response.status, "HTTP_ERROR", "HTTP помилка", "204 without ok");
    }
    return null as unknown as T;
  }

  const rawText = await response.text();

  if (response.ok) {
    if (!rawText) return null as unknown as T;
    try { return JSON.parse(rawText) as T; }
    catch { return rawText as unknown as T; }
  }
  let payload: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
  try { payload = rawText ? JSON.parse(rawText) : null; } catch { /* ok */ }

  throw {
    status: response.status,
    code:    payload?.error?.code    ?? "HTTP_ERROR",
    message: payload?.error?.message ?? `HTTP ${response.status}`,
    details: payload?.error?.details ?? rawText,
  } as ApiError;
}

function mergeSignals(...signals: AbortSignal[]): AbortSignal {
  const c = new AbortController();
  for (const s of signals) {
    if (s.aborted) { c.abort(s.reason); break; }
    s.addEventListener("abort", () => c.abort(s.reason), { once: true });
  }
  return c.signal;
}

function makeErr(status: number, code: string, message: string, details?: unknown): ApiError {
  return { status, code, message, details };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getIncidents(
  params: Record<string, string> = {},
  signal?: AbortSignal
): Promise<IncidentListResponseDto> {
  const qs = new URLSearchParams(params).toString();
  const path = qs ? `/incidents?${qs}` : "/incidents";
  return request<IncidentListResponseDto>(path, { method: "GET" }, signal);
}

export async function getIncidentById(id: string, signal?: AbortSignal): Promise<IncidentResponseDto> {
  return request<IncidentResponseDto>(`/incidents/${encodeURIComponent(id)}`, { method: "GET" }, signal);
}

export async function createIncident(dto: CreateIncidentDto, signal?: AbortSignal): Promise<IncidentResponseDto> {
  return request<IncidentResponseDto>("/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }, signal);
}

export async function updateIncident(id: string, dto: UpdateIncidentDto, signal?: AbortSignal): Promise<IncidentResponseDto> {
  return request<IncidentResponseDto>(`/incidents/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }, signal);
}

export async function deleteIncident(id: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/incidents/${encodeURIComponent(id)}`, { method: "DELETE" }, signal);
}

export async function deleteReporter(reporterId: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/incidents/reporters/${encodeURIComponent(reporterId)}`, { method: "DELETE" }, signal);
}