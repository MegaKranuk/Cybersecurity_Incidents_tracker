import type { ApiError, IncidentListItemViewModel, PaginationMeta } from "./dtos";

let noticeTimer: ReturnType<typeof setTimeout> | null = null;

export function showNotice(text: string, isError = false): void {
  const el = document.getElementById("notice") as HTMLElement;
  el.innerHTML = text;
  el.className = isError ? "notice notice--error" : "notice notice--ok";
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { el.innerHTML = ""; el.className = "notice"; }, 5000);
}

export function showApiError(err: ApiError): void {
  const lines = Array.isArray(err.details)
    ? (err.details as string[]).map((d) => `• ${d}`).join("<br>")
    : (typeof err.details === "string" ? err.details : "");
  showNotice(
    `Помилка (${err.status}): ${err.message}${lines ? "<br><small>" + lines + "</small>" : ""}`,
    true
  );
}

type ListStatus = "idle" | "loading" | "success" | "empty" | "error";

export function renderListStatus(status: ListStatus, err?: ApiError): void {
  const el = document.getElementById("listStatus") as HTMLElement;
  if      (status === "loading") el.innerHTML = '<span class="status-loading">⏳ Завантаження...</span>';
  else if (status === "empty")   el.innerHTML = '<span class="status-empty">📭 Інцидентів ще немає.</span>';
  else if (status === "error" && err)
    el.innerHTML = `<span class="status-error">${err.message}</span>`;
  else el.innerHTML = "";
}

function sanitize(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderTable(items: IncidentListItemViewModel[]): void {
  const tbody = document.getElementById("itemsTableBody") as HTMLTableSectionElement;
  tbody.innerHTML = "";
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center">—</td></tr>`;
    return;
  }
  items.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${sanitize(item.date)}</td>
      <td>${sanitize(item.tag)}</td>
      <td>${sanitize(item.criticality)}</td>
      <td>${sanitize(item.reporter)}</td>
      <td>${sanitize(item.comment)}</td>
      <td>
        <button class="editBtn"   data-id="${item.id}">Ред.</button>
        <button class="deleteBtn" data-id="${item.id}" data-reporter-id="${item.reporterId}">Вид.</button>
      </td>`;
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
  const to   = Math.min(currentPage * pageSize, totalItems);
  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `${from}–${to} з ${totalItems}`;
  el.appendChild(info);

  const prev = makePageBtn("←", currentPage === 1, () => onPage(currentPage - 1));
  el.appendChild(prev);

  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);

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
  const resetBtn  = document.getElementById("resetBtn") as HTMLButtonElement;
  if (submitBtn) {
    submitBtn.disabled  = !enabled;
    submitBtn.textContent = enabled ? "Відправити інформацію" : "Відправка...";
  }
  if (resetBtn) resetBtn.disabled = !enabled;
}

export function clearFieldErrors(): void {
  document.querySelectorAll<HTMLElement>(".error-text").forEach((el) => { el.textContent = ""; });
}

export function showFieldError(fieldId: string, message: string): void {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message;
}