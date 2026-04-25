export interface IncidentResponseDto {
  id: string;
  date: string;
  tag: string;
  criticality: string;
  reporterId: string;
  reporter: string;
  comment: string;
}

export interface IncidentListResponseDto {
  items: IncidentResponseDto[];
  meta: PaginationMeta;
}
 
export interface PaginationMeta {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
 
export interface CreateIncidentDto {
  date: string;
  tag: string;
  criticality: string;
  reporter: string;
  comment: string;
}
 
export interface UpdateIncidentDto {
  date?: string;
  tag?: string;
  criticality?: string;
  reporter?: string;
  comment?: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}
export interface IncidentListItemViewModel {
  id: string;
  reporterId: string;
  date: string;
  tag: string;
  criticality: string;
  reporter: string;
  comment: string;
}
 
export function toListItemViewModel(dto: IncidentResponseDto): IncidentListItemViewModel {
  return {
    id: dto.id,
    reporterId: dto.reporterId ?? "",
    date: dto.date ?? "–",
    tag: dto.tag ?? "–",
    criticality: dto.criticality ?? "–",
    reporter: dto.reporter ?? "(невідомо)",
    comment: dto.comment ?? "",
  };
}