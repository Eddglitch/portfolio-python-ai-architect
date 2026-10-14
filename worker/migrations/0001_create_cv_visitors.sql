CREATE TABLE IF NOT EXISTS cv_visitors (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  visitor_name TEXT NOT NULL CHECK (length(visitor_name) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_cv_visitors_created_at
  ON cv_visitors (created_at);
