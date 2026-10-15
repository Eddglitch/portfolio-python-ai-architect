interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const RETENCION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENTOS = 500;

function response(body: unknown, status: number, origin?: string): Response {
  const headers = new Headers(jsonHeaders);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function preflight(origin: string, methods: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

async function purgar(env: Env): Promise<void> {
  await env.DB.prepare("DELETE FROM cv_visitors WHERE created_at < ?")
    .bind(Date.now() - RETENCION_MS)
    .run();
}

async function estadisticas(env: Env, origin: string): Promise<Response> {
  await purgar(env);
  const desde = Date.now() - RETENCION_MS;
  const { results } = await env.DB.prepare(
    "SELECT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS dia, SUM(weight) AS valor " +
      "FROM cv_visitors WHERE created_at >= ? GROUP BY dia ORDER BY dia",
  )
    .bind(desde)
    .all<{ dia: string; valor: number }>();
  const dias = (results ?? []).map((row) => ({ dia: row.dia, valor: Number(row.valor) }));
  const total = dias.reduce((sum, row) => sum + row.valor, 0);
  return response({ total, dias, generado: Date.now() }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const originOk = allowedOrigins.includes(origin);

    if (url.pathname === "/api/cv-visitors/stats") {
      if (request.method === "OPTIONS") return preflight(origin, "GET, OPTIONS");
      if (!originOk) return response({ error: "Origin not allowed" }, 403);
      if (request.method !== "GET") return response({ error: "Method not allowed" }, 405, origin);
      try {
        return await estadisticas(env, origin);
      } catch {
        return response({ error: "Could not read stats" }, 500, origin);
      }
    }

    if (url.pathname !== "/api/cv-visitors") {
      return response({ error: "Not found" }, 404);
    }
    if (request.method === "OPTIONS") return preflight(origin, "POST, OPTIONS");
    if (!originOk) return response({ error: "Origin not allowed" }, 403);
    if (request.method !== "POST") {
      return response({ error: "Method not allowed" }, 405, origin);
    }

    const contentType = (request.headers.get("Content-Type") ?? "").toLowerCase();
    if (!contentType.startsWith("application/json") && !contentType.startsWith("text/plain")) {
      return response({ error: "Unsupported Content-Type" }, 415, origin);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return response({ error: "Invalid JSON" }, 400, origin);
    }
    if (typeof payload !== "object" || payload === null) {
      return response({ error: "Invalid payload" }, 400, origin);
    }
    const rawSeed = (payload as { seed?: unknown }).seed;
    const rawEvents = (payload as { events?: unknown }).events;
    const seed = typeof rawSeed === "number" && Number.isInteger(rawSeed) ? rawSeed : NaN;
    const events = typeof rawEvents === "number" && Number.isInteger(rawEvents) ? rawEvents : NaN;
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      return response({ error: "seed must be a 32-bit unsigned integer" }, 400, origin);
    }
    if (!Number.isInteger(events) || events < 1 || events > MAX_EVENTOS) {
      return response({ error: `events must be between 1 and ${MAX_EVENTOS}` }, 400, origin);
    }

    try {
      await purgar(env);
      await env.DB.prepare("INSERT INTO cv_visitors (seed, weight, created_at) VALUES (?, ?, ?)")
        .bind(seed, events, Date.now())
        .run();
      return response({ ok: true }, 201, origin);
    } catch {
      return response({ error: "Could not save metric" }, 500, origin);
    }
  },
};
