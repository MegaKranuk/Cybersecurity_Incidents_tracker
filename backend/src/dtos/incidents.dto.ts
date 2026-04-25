export interface CreateIncidentRequestDto {
  date: string;
  tag: string;
  criticality: string;
  reporter: string;
  comment: string;
}

export interface UpdateIncidentRequestDto {
  date?: string;
  tag?: string;
  criticality?: string;
  reporter?: string;
  comment?: string;
}

export interface IncidentResponseDto {
  id: string;
  date: string;
  tag: string;
  criticality: string;
  reporterId: string;
  reporter: string;
  comment: string;
}