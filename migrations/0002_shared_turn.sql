CREATE TABLE IF NOT EXISTS turnero_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_person_id INTEGER REFERENCES persona(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO turnero_state (id, current_person_id)
SELECT 1, (SELECT id FROM persona ORDER BY id ASC LIMIT 1);
