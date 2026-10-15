# Métricas anónimas de visita (Cloudflare Worker + D1)

Este documento describe el sistema que cuenta —de forma anónima y agregada— las
visitas al portafolio, además de las métricas públicas que se muestran en la
sección _Transparencia_.

## Principios

- **Sin datos personales.** No se guarda nombre, correo ni IP. Solo valores
  **numéricos**: un `seed` anónimo y un `weight` (cuántas señales aportó la sesión).
- **Participación voluntaria (opt-in/opt-out).** En la sección _Transparencia_ el
  visitante decide si su visita cuenta. Si opta por no participar, no se envía nada.
- **Escrituras estratégicas.** La métrica viaja **una sola vez** por sesión, al
  cerrar o enviar la pestaña al fondo (`pagehide` / `visibilitychange` con
  `navigator.sendBeacon`), nunca en cada clic.
- **Caché híbrida.** El frontend cachea en memoria + `sessionStorage` con TTL y
  `stale-while-revalidate`, para no golpear la base en cada render.
- **Retención de 7 días.** El Worker purga en cada escritura las filas con
  `created_at` anterior a 7 días.

## Arquitectura

```
Navegador (GitHub Pages)
  └─ src/components/metricas.ts     (caché híbrida + sendBeacon)
        │  POST { seed, events }              GET /stats
        ▼                                            ▼
Cloudflare Worker: cv-visitors-api
  └─ worker/src/index.ts
        │  INSERT INTO cv_visitors (seed, weight, created_at)
        │  SELECT … GROUP BY día  (últimos 7 días)
        ▼
Cloudflare D1: cv-visitors  (tabla cv_visitors, solo columnas numéricas)
```

- **Frontend:** `src/components/metricas.ts` (caché + envío) y
  `src/components/public-metrics.tsx` (dashboard). La sección _Transparencia_ vive
  en `src/components/bio-page.tsx`; el control de participación en
  `src/components/participacion.ts` y el apodo anónimo en `src/components/seudonimo.ts`.
- **Worker:** `worker/src/index.ts` (nombre `cv-visitors-api`). Valida el header
  `Origin` contra `ALLOWED_ORIGINS`.
- **Base de datos:** D1 `cv-visitors` (`database_id = d17bca59-da40-4ee3-87ed-5efcb8b5182b`),
  binding `DB` definido en `worker/wrangler.toml`.

## Endpoints

### `POST /api/cv-visitors`

| Elemento            | Valor                                                         |
| :------------------ | :------------------------------------------------------------ |
| Cuerpo              | `{ "seed": 123456789, "events": 2 }`                          |
| Validación          | `seed` entero 32-bit sin signo; `events` entero entre 1 y 500 |
| Content-Type        | `application/json` o `text/plain` (para `sendBeacon`)         |
| Respuesta OK        | `201 { "ok": true }`                                          |
| Origen no permitido | `403 { "error": "Origin not allowed" }`                       |
| Payload inválido    | `400 { "error": "…" }`                                        |
| Método incorrecto   | `405 { "error": "Method not allowed" }`                       |

### `GET /api/cv-visitors/stats`

Devuelve el agregado de los últimos 7 días (últimos 7 días, sin datos individuales):

```json
{ "total": 12, "dias": [{ "dia": "2026-10-15", "valor": 7 }], "generado": 1760000000000 }
```

| Elemento            | Valor                                                     |
| :------------------ | :-------------------------------------------------------- |
| Origen permitido    | `https://eddglitch.github.io` (y `http://localhost:3000`) |
| Respuesta OK        | `200 { total, dias, generado }`                           |
| Origen no permitido | `403 { "error": "Origin not allowed" }`                   |

## Esquema de la tabla

```sql
CREATE TABLE cv_visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed INTEGER NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL        -- epoch en milisegundos
);

CREATE INDEX idx_cv_visitors_created_at ON cv_visitors (created_at);
```

## Migraciones

Ubicación: `worker/migrations/`. Se aplican con Wrangler.

| Migración                      | Propósito                                                                                                              |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `0001_create_cv_visitors.sql`  | Crea `cv_visitors` con el esquema inicial.                                                                             |
| `0002_rebuild_cv_visitors.sql` | Alinea la tabla con el esquema de nombres de la época (corrige el issue #1).                                           |
| `0003_numeric_only.sql`        | **Migra a esquema estrictamente numérico** (issues #4 y #6): elimina los nombres; solo `seed`, `weight`, `created_at`. |

> Nota: `0003` **no migra** las filas con texto (contienen nombres); quedan fuera
> por diseño. Respaldar antes de aplicar (ver abajo).

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

1. Preflight CORS (GET):

   ```bash
   curl -i -X OPTIONS "https://cv-visitors-api.cv-visitor-worker.workers.dev/api/cv-visitors/stats" \
     -H "Origin: https://eddglitch.github.io"
   # -> 204 con Access-Control-Allow-Origin: https://eddglitch.github.io
   ```

2. Registro anónimo:

   ```bash
   curl -i -X POST "https://cv-visitors-api.cv-visitor-worker.workers.dev/api/cv-visitors" \
     -H "Origin: https://eddglitch.github.io" \
     -H "Content-Type: application/json" \
     --data '{"seed":123456789,"events":2}'
   # -> 201 {"ok":true}
   ```

3. Estadísticas:

   ```bash
   curl -i "https://cv-visitors-api.cv-visitor-worker.workers.dev/api/cv-visitors/stats" \
     -H "Origin: https://eddglitch.github.io"
   # -> 200 {"total":N,"dias":[...],"generado":...}
   ```

4. Comprobar filas (solo columnas numéricas):

   ```bash
   cd worker
   npx wrangler d1 execute cv-visitors --remote --command \
     "SELECT id, seed, weight, created_at FROM cv_visitors ORDER BY created_at DESC LIMIT 5"
   ```

## Privacidad

El aviso de privacidad bilingüe está en [`PRIVACY.md`](../PRIVACY.md). Resumen:
solo valores numéricos, retención de 7 días, sin cookies ni terceros, y control de
participación por parte del visitante.
