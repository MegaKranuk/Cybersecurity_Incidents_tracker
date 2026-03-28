import fs from "fs";
import path from "path";
import { run, all, escapeSql } from "./dbClient";

export async function migrate(): Promise<void> {
  await run("PRAGMA foreign_keys = ON;");
  
  await run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      appliedAt TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();

  const applied = await all<{ filename: string }>("SELECT filename FROM schema_migrations;");
  const appliedSet = new Set(applied.map((x) => x.filename));

  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8").trim();

    if (!sql) continue;

    try {
      await run(sql);
      const now = new Date().toISOString();
      await run(`INSERT INTO schema_migrations (filename, appliedAt) VALUES ('${escapeSql(file)}', '${now}');`);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.error(`Error applying migration ${file}:`, err);
      process.exit(1);
    }
  }
  console.log("Database is up to date.");
}