import { getIncidents, createIncident, updateIncident, deleteReporter } from "./apiClient";
import { cacheGet, cacheSet, invalidateAll } from "./cache";
import {
  renderListStatus, renderTable, renderPagination,
  setFormEnabled, clearFieldErrors, showFieldError,
  showNotice, showApiError,
} from "./ui";
import type { ApiError, CreateIncidentDto } from "./dtos";
import { toListItemViewModel } from "./dtos";

interface ListState {
  page: number;
  pageSize: number;
  tag: string;
  criticality: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const state: ListState = {
  page: 1,
  pageSize: 5,
  tag: "",
  criticality: "",
  sortBy: "",
  sortDir: "asc",
};

let editId: string | null = null;
let activeLoadController: AbortController | null = null;

async function loadList(bustCache = false): Promise<void> {
  if (activeLoadController) activeLoadController.abort();
  activeLoadController = new AbortController();
  const signal = activeLoadController.signal;

  const params: Record<string, string> = {
    page:     String(state.page),
    pageSize: String(state.pageSize),
  };
  if (state.tag)         params.tag         = state.tag;
  if (state.criticality) params.criticality = state.criticality;
  if (state.sortBy)      params.sortBy      = state.sortBy;
  if (state.sortBy)      params.sortDir     = state.sortDir;

  const cacheKey = new URLSearchParams(params).toString();

  if (!bustCache) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      renderTable(cached.items.map(toListItemViewModel));
      renderPagination(cached.meta, state.page, goToPage);
      renderListStatus("success");
      showCacheLabel(true);
      return;
    }
  }

  showCacheLabel(false);
  renderListStatus("loading");

  try {
    const data = await getIncidents(params, signal);
    cacheSet(cacheKey, data);

    if (!data.items || data.items.length === 0) {
      renderTable([]);
      renderPagination(null, 1, goToPage);
      renderListStatus("empty");
      return;
    }

    renderTable(data.items.map(toListItemViewModel));
    renderPagination(data.meta, state.page, goToPage);
    renderListStatus("success");
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    if (apiErr.code !== "ABORTED") {
      renderTable([]);
      renderPagination(null, 1, goToPage);
      renderListStatus("error", apiErr);
    }
  }
}

function goToPage(page: number): void {
  state.page = page;
  loadList();
}

function showCacheLabel(fromCache: boolean): void {
  const el = document.getElementById("cacheLabel");
  if (el) el.textContent = fromCache ? "⚡ з кешу" : "";
}

document.getElementById("filterTag")?.addEventListener("change", (e) => {
  state.tag = (e.target as HTMLSelectElement).value;
  state.page = 1;
  loadList();
});

document.getElementById("filterCriticality")?.addEventListener("change", (e) => {
  state.criticality = (e.target as HTMLSelectElement).value;
  state.page = 1;
  loadList();
});

document.getElementById("filterPageSize")?.addEventListener("change", (e) => {
  state.pageSize = Number((e.target as HTMLSelectElement).value);
  state.page = 1;
  loadList();
});

document.getElementById("clearFilters")?.addEventListener("click", () => {
  state.tag = "";
  state.criticality = "";
  state.page = 1;
  (document.getElementById("filterTag") as HTMLSelectElement).value = "";
  (document.getElementById("filterCriticality") as HTMLSelectElement).value = "";
  loadList();
});

document.querySelectorAll<HTMLElement>("th[data-field]").forEach((th) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    const field = th.dataset.field!;
    if (state.sortBy === field) {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.sortBy = field;
      state.sortDir = "asc";
    }
    state.page = 1;

    document.querySelectorAll("th[data-field] span").forEach((s) => (s.textContent = "⬍"));
    const span = th.querySelector("span");
    if (span) span.textContent = state.sortDir === "asc" ? "↑" : "↓";

    loadList();
  });
});

const form = document.getElementById("createForm") as HTMLFormElement;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const dto = readFormDto();
  setFormEnabled(false);
  clearFieldErrors();

  try {
    if (editId) {
      await updateIncident(editId, dto);
      showNotice("Інцидент оновлено");
      editId = null;
    } else {
      await createIncident(dto);
      showNotice("Інцидент додано");
    }
    invalidateAll();
    form.reset();
    state.page = 1;
    await loadList(true);
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    showApiError(apiErr);
    if (Array.isArray(apiErr.details)) {
      (apiErr.details as string[]).forEach((msg) => {
        if (msg.includes("Date"))        showFieldError("dateError", msg);
        else if (msg.includes("Reporter")) showFieldError("reporterError", msg);
        else if (msg.includes("Comment")) showFieldError("commentError", msg);
        else if (msg.includes("criticality")) showFieldError("criticalityError", msg);
        else if (msg.includes("tag"))    showFieldError("tagError", msg);
      });
    }
  } finally {
    setFormEnabled(true);
  }
});

const tableBody = document.getElementById("itemsTableBody") as HTMLTableSectionElement;

tableBody.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  const id = target.dataset.id;
  if (!id) return;

  if (target.classList.contains("deleteBtn")) {
    const reporterId = target.dataset.reporterId ?? "";
    if (!confirm("Видалити інцидент та репортера?")) return;
    try {
      await deleteReporter(reporterId);
      invalidateAll();
      showNotice("🗑 Видалено");
      if (state.page > 1) state.page = 1;
      await loadList(true);
    } catch (err: unknown) {
      showApiError(err as ApiError);
    }
  }

  if (target.classList.contains("editBtn")) {
    const row = target.closest("tr");
    if (!row) return;
    const cells = row.querySelectorAll("td");
    if (cells.length < 6) return;

    (document.getElementById("dateInput") as HTMLInputElement).value         = cells[1].textContent ?? "";
    (document.getElementById("tagSelect") as HTMLSelectElement).value        = cells[2].textContent ?? "";
    (document.getElementById("criticalitySelect") as HTMLSelectElement).value = cells[3].textContent ?? "";
    (document.getElementById("reporterInput") as HTMLInputElement).value     = cells[4].textContent ?? "";
    (document.getElementById("commentInput") as HTMLTextAreaElement).value   = cells[5].textContent ?? "";

    editId = id;
    (document.getElementById("reporterInput") as HTMLInputElement).focus();
    showNotice("✏️ Режим редагування");
  }
});

document.getElementById("resetBtn")?.addEventListener("click", () => {
  editId = null;
  clearFieldErrors();
});

function validateForm(): boolean {
  clearFieldErrors();
  let valid = true;
  const date        = (document.getElementById("dateInput") as HTMLInputElement).value;
  const tag         = (document.getElementById("tagSelect") as HTMLSelectElement).value;
  const criticality = (document.getElementById("criticalitySelect") as HTMLSelectElement).value;
  const reporter    = (document.getElementById("reporterInput") as HTMLInputElement).value;
  const comment     = (document.getElementById("commentInput") as HTMLTextAreaElement).value;

  if (!date)               { showFieldError("dateError",        "Виберіть дату!");            valid = false; }
  if (!tag)                { showFieldError("tagError",         "Виберіть тип!");             valid = false; }
  if (!criticality)        { showFieldError("criticalityError", "Виберіть критичність!");     valid = false; }
  if (reporter.length < 5) { showFieldError("reporterError",   "Ім'я мінімум 5 символів!"); valid = false; }
  if (comment.length < 15) { showFieldError("commentError",    "Опис мінімум 15 символів!"); valid = false; }
  return valid;
}

function readFormDto(): CreateIncidentDto {
  return {
    date:        (document.getElementById("dateInput") as HTMLInputElement).value,
    tag:         (document.getElementById("tagSelect") as HTMLSelectElement).value,
    criticality: (document.getElementById("criticalitySelect") as HTMLSelectElement).value,
    reporter:    (document.getElementById("reporterInput") as HTMLInputElement).value,
    comment:     (document.getElementById("commentInput") as HTMLTextAreaElement).value,
  };
}

(document.getElementById("dateInput") as HTMLInputElement).max =
  new Date().toISOString().split("T")[0];

loadList();