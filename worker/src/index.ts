interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

function response(body: unknown, status: number, origin?: string): Response {
  const headers = new Headers(jsonHeaders);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim());

    if (url.pathname !== "/api/cv-visitors") {
      return response({ error: "Not found" }, 404);
    }
    if (!allowedOrigins.includes(origin)) {
      return response({ error: "Origin not allowed" }, 403);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }
    if (request.method !== "POST") {
      return response({ error: "Method not allowed" }, 405, origin);
    }
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return response({ error: "Content-Type must be application/json" }, 415, origin);
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
    const rawName = (payload as { name?: unknown }).name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (name.length < 1 || name.length > 120) {
      return response({ error: "Name must contain 1 to 120 characters" }, 400, origin);
    }

    try {
      await env.DB.prepare("INSERT INTO cv_visitors (visitor_name) VALUES (?)").bind(name).run();
      return response({ ok: true }, 201, origin);
    } catch {
      return response({ error: "Could not save registration" }, 500, origin);
    }
  },
};
