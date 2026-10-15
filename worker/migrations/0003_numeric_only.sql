-- 0003_numeric_only.sql
-- Migra cv_visitors a un esquema estrictamente numerico (issues #4 y #6).
--
-- Contexto:
--   El esquema previo (0002) guardaba `visitor_name` (texto), es decir, un dato
--   personal. El rediseno elimina por completo el nombre: solo se conserva un
--   `seed` numerico anonimo y un `weight` (cuantas senales aporto esa sesion),
--   junto con la marca de tiempo numerica `created_at` (epoch en ms).
--
-- Privacidad:
--   No se migran los registros con texto (contenian nombres); quedan fuera por
--   diseno. La retencion de 7 dias la aplica el Worker en cada escritura.
--
-- Orden importante: se elimina la tabla legacy (y su indice) ANTES de recrear
--   el indice, porque el nombre idx_cv_visitors_created_at se reutiliza.

ALTER TABLE cv_visitors RENAME TO cv_visitors_text;

CREATE TABLE cv_visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed INTEGER NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

DROP TABLE cv_visitors_text;

CREATE INDEX IF NOT EXISTS idx_cv_visitors_created_at
  ON cv_visitors (created_at);
