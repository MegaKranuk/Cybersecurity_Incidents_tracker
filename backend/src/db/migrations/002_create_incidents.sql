CREATE TABLE Incidents (
    id TEXT PRIMARY KEY,
    reporterId TEXT NOT NULL,
    date TEXT NOT NULL,
    tag TEXT NOT NULL,
    criticality TEXT NOT NULL CHECK (criticality IN ('Низька критичність', 'Трохи критично', 'Середня критичність', 'Відчутна критичність', 'Дуже критично')),
    FOREIGN KEY (reporterId) REFERENCES Reporters(id) ON DELETE RESTRICT
);