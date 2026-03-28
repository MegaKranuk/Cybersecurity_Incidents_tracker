import { v4 as uuid } from "uuid";
import { all, get, run, escapeSql } from "../db/dbClient";
import { IncidentResponseDto, CreateIncidentRequestDto, UpdateIncidentRequestDto } from "../dtos/incidents.dto";

export class IncidentsRepository {
  async findAll(): Promise<IncidentResponseDto[]> {
    return await all<IncidentResponseDto>(`
      SELECT 
        i.id, i.date, i.tag, i.criticality,
        r.name as reporter,
        c.text as comment
      FROM Incidents i
      JOIN Reporters r ON i.reporterId = r.id
      LEFT JOIN Comments c ON c.incidentId = i.id
      ORDER BY i.date DESC
    `);
  }

  async findById(id: string): Promise<IncidentResponseDto | null> {
    const row = await get<IncidentResponseDto>(`
      SELECT 
        i.id, i.date, i.tag, i.criticality,
        r.name as reporter,
        c.text as comment
      FROM Incidents i
      JOIN Reporters r ON i.reporterId = r.id
      LEFT JOIN Comments c ON c.incidentId = i.id
      WHERE i.id = '${escapeSql(id)}'
    `);
    return row || null;
  }

  async create(data: CreateIncidentRequestDto): Promise<IncidentResponseDto> {
    const safeReporter = escapeSql(data.reporter);
    const safeComment = escapeSql(data.comment);
    
    const newReporterId = uuid();
    await run(`INSERT OR IGNORE INTO Reporters (id, name) VALUES ('${newReporterId}', '${safeReporter}')`);
    const reporter = await get<{ id: string }>(`SELECT id FROM Reporters WHERE name = '${safeReporter}'`);
    
    const incidentId = uuid();
    await run(`
      INSERT INTO Incidents (id, reporterId, date, tag, criticality) 
      VALUES ('${incidentId}', '${reporter!.id}', '${escapeSql(data.date)}', '${escapeSql(data.tag)}', '${escapeSql(data.criticality)}')
    `);

    const commentId = uuid();
    await run(`
      INSERT INTO Comments (id, incidentId, text)
      VALUES ('${commentId}', '${incidentId}', '${safeComment}')
    `);

    return (await this.findById(incidentId)) as IncidentResponseDto;
  }

  async update(id: string, data: UpdateIncidentRequestDto): Promise<IncidentResponseDto | null> {
    if (data.reporter) {
      const safeReporter = escapeSql(data.reporter);
      const newReporterId = uuid();
      await run(`INSERT OR IGNORE INTO Reporters (id, name) VALUES ('${newReporterId}', '${safeReporter}')`);
      const reporter = await get<{ id: string }>(`SELECT id FROM Reporters WHERE name = '${safeReporter}'`);
      
      if (reporter) {
        await run(`UPDATE Incidents SET reporterId = '${reporter.id}' WHERE id = '${escapeSql(id)}'`);
      }
    }

    if (data.date || data.tag || data.criticality) {
      const setClauses = [];
      if (data.date) setClauses.push(`date = '${escapeSql(data.date)}'`);
      if (data.tag) setClauses.push(`tag = '${escapeSql(data.tag)}'`);
      if (data.criticality) setClauses.push(`criticality = '${escapeSql(data.criticality)}'`);

      if (setClauses.length > 0) {
        await run(`UPDATE Incidents SET ${setClauses.join(', ')} WHERE id = '${escapeSql(id)}'`);
      }
    }

    if (data.comment) {
      await run(`UPDATE Comments SET text = '${escapeSql(data.comment)}' WHERE incidentId = '${escapeSql(id)}'`);
    }

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await run(`DELETE FROM Incidents WHERE id = '${escapeSql(id)}'`);
    return result.changes > 0;
  }

  async getStats() {
    return await all(`
      SELECT tag, COUNT(*) as incidentCount 
      FROM Incidents 
      GROUP BY tag 
      ORDER BY incidentCount DESC
    `);
  }

async searchVulnerable(query: string) {
  return await all(`
    SELECT * FROM Incidents 
    WHERE tag LIKE '%${query}%' 
    ORDER BY date DESC 
    LIMIT 5
  `);
}
}