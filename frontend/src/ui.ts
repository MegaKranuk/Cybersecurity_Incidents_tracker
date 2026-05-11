import type { ApiError, IncidentListItemViewModel, PaginationMeta } from "./dtos";

let noticeTimer: ReturnType<typeof setTimeout> | null = null;

export function showNotice(text: string, isError = false): void {
  const el = document.getElementById("notice") as HTMLElement;
  el.textContent = text;
  el.className = isError ? "notice notice--error" : "notice notice--ok";
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { el.textContent = ""; el.className = "notice"; }, 5000);
}

export function showApiError(err: ApiError): void {
  const details = Array.isArray(err.details)
    ? (err.details as string[]).join(", ")
    : typeof err.details === "string" ? err.details : "";
  showNotice(`Помилка (${err.status}): ${err.message}${details ? ` — ${details}` : ""}`, true);
}

type ListStatus = "idle" | "loading" | "success" | "empty" | "error";

export function renderListStatus(status: ListStatus, err?: ApiError): void {
  const el = document.getElementById("listStatus") as HTMLElement;
  el.textContent = "";
  if (status === "loading")       { el.textContent = "⏳ Завантаження..."; el.className = "status-loading"; }
  else if (status === "empty")    { el.textContent = "📭 Інцидентів ще немає."; el.className = "status-empty"; }
  else if (status === "error" && err) { el.textContent = err.message; el.className = "status-error"; }
  else el.className = "";
}

function td(text: string): HTMLTableCellElement {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

export function renderTable(items: IncidentListItemViewModel[]): void {
  const tbody = document.getElementById("itemsTableBody") as HTMLTableSectionElement;
  tbody.innerHTML = "";

  if (items.length === 0) {
    const tr = document.createElement("tr");
    const empty = document.createElement("td");
    empty.colSpan = 7;
    empty.style.textAlign = "center";
    empty.textContent = "—";
    tr.appendChild(empty);
    tbody.appendChild(tr);
    return;
  }

  items.forEach((item, index) => {
    const tr = document.createElement("tr");

    const numCell = document.createElement("td");
    numCell.textContent = String(index + 1);
    tr.appendChild(numCell);

    tr.appendChild(td(item.date));
    tr.appendChild(td(item.tag));
    tr.appendChild(td(item.criticality));
    tr.appendChild(td(item.reporter));
    tr.appendChild(td(item.comment));

    const actionCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "editBtn";
    editBtn.textContent = "Ред.";
    editBtn.setAttribute("data-id", item.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "deleteBtn";
    deleteBtn.textContent = "Вид.";
    deleteBtn.setAttribute("data-id", item.id);
    deleteBtn.setAttribute("data-reporter-id", item.reporterId);

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    tr.appendChild(actionCell);
    tbody.appendChild(tr);
  });
}

export function renderPagination(
  meta: PaginationMeta | null,
  currentPage: number,
  onPage: (page: number) => void
): void {
  const el = document.getElementById("pagination") as HTMLElement;
  el.innerHTML = "";
  if (!meta || meta.totalPages <= 1) return;

  const { totalPages, totalItems, pageSize } = meta;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `${from}–${to} з ${totalItems}`;
  el.appendChild(info);

  const prev = makePageBtn("←", currentPage === 1, () => onPage(currentPage - 1));
  el.appendChild(prev);

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) el.appendChild(makePageBtn("1", false, () => onPage(1)));
  if (start > 2) el.appendChild(makeEllipsis());

  for (let p = start; p <= end; p++) {
    const btn = makePageBtn(String(p), false, () => onPage(p));
    if (p === currentPage) btn.classList.add("page-btn--active");
    el.appendChild(btn);
  }

  if (end < totalPages - 1) el.appendChild(makeEllipsis());
  if (end < totalPages) el.appendChild(makePageBtn(String(totalPages), false, () => onPage(totalPages)));

  const next = makePageBtn("→", currentPage === totalPages, () => onPage(currentPage + 1));
  el.appendChild(next);
}

function makePageBtn(label: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "page-btn";
  btn.textContent = label;
  btn.disabled = disabled;
  btn.addEventListener("click", onClick);
  return btn;
}

function makeEllipsis(): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = "page-ellipsis";
  s.textContent = "…";
  return s;
}

export function setFormEnabled(enabled: boolean): void {
  const submitBtn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
  const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
  if (submitBtn) { submitBtn.disabled = !enabled; submitBtn.textContent = enabled ? "Відправити інформацію" : "Відправка..."; }
  if (resetBtn) resetBtn.disabled = !enabled;
}

export function clearFieldErrors(): void {
  document.querySelectorAll<HTMLElement>(".error-text").forEach((el) => { el.textContent = ""; });
}

export function showFieldError(fieldId: string, message: string): void {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message;
}

export function renderThreatStats(items: any[]) {
  const tbody = document.getElementById("threatStatsBody") as HTMLElement;
  tbody.innerHTML = "";

  if (!items?.length) {
    const tr = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "Немає даних";
    tr.appendChild(cell);
    tbody.appendChild(tr);
    return;
  }

  items.forEach((item) => {
    const tr = document.createElement("tr");

    const reporterCell = document.createElement("td");
    reporterCell.textContent = item.reporter ?? "";
    tr.appendChild(reporterCell);

    const critCell = document.createElement("td");
    critCell.textContent = item.criticality ?? "";
    tr.appendChild(critCell);

    const descCell = document.createElement("td");
    const ul = document.createElement("ul");
    ul.style.cssText = "margin:0;padding-left:20px;text-align:left";

    String(item.description ?? "").split("\n").filter((d) => d.trim() !== "").forEach((desc) => {
      const li = document.createElement("li");
      li.textContent = desc; 
      ul.appendChild(li);
    });

    descCell.appendChild(ul);
    tr.appendChild(descCell);
    tbody.appendChild(tr);
  });
}