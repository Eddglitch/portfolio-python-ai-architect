-- 0002_rebuild_cv_visitors.sql
-- Alinea la tabla cv_visitors con el esquema que espera el Worker cv-visitors-api.
--
-- Contexto (issue #1):
--   El esquema previo (legacy) era:
--     cv_visitors(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, created_at TEXT, expires_at TEXT)
--   El Worker actual ejecuta: INSERT INTO cv_visitors (visitor_name) VALUES (?).
--   Como la migracion 0001 usa CREATE TABLE IF NOT EXISTS, la tabla preexistente
--   nunca se actualizo y la columna visitor_name no existia -> HTTP 500.
--
-- Esta migracion reconstruye la tabla al esquema nuevo conservando los registros
-- existentes (mapea name -> visitor_name). El TTL de 7 dias (expires_at) se elimina:
-- los registros pasan a ser permanentes.
--
-- Orden importante: se debe DROP de la tabla legacy ANTES de recrear el indice
-- idx_cv_visitors_created_at, porque el indice legacy conserva ese nombre.

ALTER TABLE cv_visitors RENAME TO cv_visitors_legacy;

CREATE TABLE cv_visitors (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  visitor_name TEXT NOT NULL CHECK (length(visitor_name) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO cv_visitors (visitor_name, created_at)
  SELECT name, created_at
  FROM cv_visitors_legacy
  WHERE name IS NOT NULL
    AND length(trim(name)) BETWEEN 1 AND 120;

DROP TABLE cv_visitors_legacy;

CREATE INDEX IF NOT EXISTS idx_cv_visitors_created_at
  ON cv_visitors (created_at);
