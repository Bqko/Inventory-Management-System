-- Users table (Member A). Member B: merge this into the team's full schema.sql.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- When Member B adds stock_movements, link it like this:
--   user_id INTEGER NOT NULL REFERENCES users(id)
