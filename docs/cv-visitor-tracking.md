# Registro de visitantes del CV (Cloudflare Worker + D1)

Este documento describe el sistema que registra quién solicita ver el CV desde el
sitio desplegado en GitHub Pages, y documenta el incidente y la corrección del
esquema de base de datos.

## Arquitectura

```
Navegador (GitHub Pages)
  └─ src/components/cv-access-dialog.tsx
        │  POST { name }
        ▼
Cloudflare Worker: cv-visitors-api
  └─ worker/src/index.ts        (POST /api/cv-visitors)
        │  INSERT INTO cv_visitors (visitor_name) VALUES (?)
        ▼
Cloudflare D1: cv-visitors  (tabla cv_visitors)
```

- **Frontend:** `src/components/cv-access-dialog.tsx`. Al enviar el formulario hace
  `fetch` a `${VITE_CV_VISITORS_API_URL || "https://cv-visitors-api.cv-visitor-worker.workers.dev"}/api/cv-visitors`.
- **Worker:** `worker/src/index.ts` (nombre `cv-visitors-api`). Solo acepta
  `POST` sobre `/api/cv-visitors`, valida el header `Origin` contra
  `ALLOWED_ORIGINS` y exige `Content-Type: application/json`.
- **Base de datos:** D1 `cv-visitors` (`database_id = d17bca59-da40-4ee3-87ed-5efcb8b5182b`),
  binding `DB` definido en `worker/wrangler.toml`.

## Endpoint

`POST /api/cv-visitors`

| Elemento            | Valor                                                              |
| :------------------ | :----------------------------------------------------------------- |
| Cuerpo              | `{ "name": "Nombre u organización" }`                              |
| Validación          | `name` string de 1 a 120 caracteres                                |
| Origen permitido    | `https://eddglitch.github.io` (y `http://localhost:3000` en local) |
| Respuesta OK        | `201 { "ok": true }`                                               |
| Origen no permitido | `403 { "error": "Origin not allowed" }`                            |
| Nombre inválido     | `400 { "error": "Name must contain 1 to 120 characters" }`         |
| Método incorrecto   | `405 { "error": "Method not allowed" }`                            |

## Esquema de la tabla

```sql
CREATE TABLE cv_visitors (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  visitor_name TEXT NOT NULL CHECK (length(visitor_name) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_cv_visitors_created_at ON cv_visitors (created_at);
```

> Nota: el esquema nuevo elimina el TTL de 7 días que existía en el Worker
> anterior (`expires_at`). Los registros son ahora permanentes.

## Migraciones

Ubicación: `worker/migrations/`. Se aplican con Wrangler.

| Migración                      | Propósito                                                                                                           |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `0001_create_cv_visitors.sql`  | Crea `cv_visitors` con el esquema nuevo (`visitor_name`).                                                           |
| `0002_rebuild_cv_visitors.sql` | Reconstruye la tabla si existía con el esquema legacy (`name`/`expires_at`) y migra las filas. Corrige el issue #1. |

### Aplicar migraciones

```bash
cd worker
npx wrangler d1 migrations apply cv-visitors --remote
```

### Respaldo previo (recomendado antes de cambios de esquema)

```bash
cd worker
npx wrangler d1 export cv-visitors --remote --output backup_cv_visitors.sql
```

## Despliegue del Worker

```bash
cd worker
npx wrangler deploy
```

El sitio en GitHub Pages se despliega automáticamente con el workflow
`.github/workflows/deploy-pages.yml` al hacer push a `gh-pages`.

## Verificación

1. Preflight CORS:

   ```bash
   curl -i -X OPTIONS "https://cv-visitors-api.cv-visitor-worker.workers.dev/api/cv-visitors" \
     -H "Origin: https://eddglitch.github.io"
   # -> 204 con Access-Control-Allow-Origin: https://eddglitch.github.io
   ```

2. Registro real:

   ```bash
   curl -i -X POST "https://cv-visitors-api.cv-visitor-worker.workers.dev/api/cv-visitors" \
     -H "Origin: https://eddglitch.github.io" \
     -H "Content-Type: application/json" \
     --data '{"name":"prueba-cli"}'
   # -> 201 {"ok":true}
   ```

3. Comprobar filas:

   ```bash
   cd worker
   npx wrangler d1 execute cv-visitors --remote --command \
     "SELECT id, visitor_name, created_at FROM cv_visitors ORDER BY created_at DESC LIMIT 5"
   ```

## Incidente #1 — HTTP 500 al registrar (esquema desalineado)

- **Síntoma:** el formulario del CV no registraba visitas; `POST` devolvía
  `500 {"error":"Could not save registration"}`.
- **Causa raíz:** la tabla remota conservaba el esquema legacy
  `(id INTEGER, name, created_at, expires_at)`, pero el Worker nuevo inserta en la
  columna `visitor_name`. La migración `0001` usaba `CREATE TABLE IF NOT EXISTS`,
  así que nunca actualizó la tabla preexistente.
- **Corrección:** migración `0002_rebuild_cv_visitors.sql`, que reconstruye la
  tabla al esquema nuevo preservando los registros (`name` -> `visitor_name`).
- **Rollback:** restaurar desde el respaldo exportado con `wrangler d1 export` y
  volver a aplicar el esquema anterior si fuese necesario.
