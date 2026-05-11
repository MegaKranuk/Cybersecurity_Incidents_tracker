CREATE TABLE IF NOT EXISTS Users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO Users (id, name) VALUES
  ('user-001', 'Alice'),
  ('user-002', 'Bob'),
  ('user-003', 'Charlie');

UPDATE Incidents SET ownerUserId = 'user-001' WHERE ownerUserId IS NULL;