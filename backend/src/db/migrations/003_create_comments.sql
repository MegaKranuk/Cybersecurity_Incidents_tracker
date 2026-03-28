CREATE TABLE Comments (
    id TEXT PRIMARY KEY,
    incidentId TEXT NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (incidentId) REFERENCES Incidents(id) ON DELETE CASCADE
);