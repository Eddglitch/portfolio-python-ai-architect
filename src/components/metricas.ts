import { useEffect, useState } from "react";
import { getParticipation } from "@/components/participacion";
import { seedDeSesion } from "@/components/seudonimo";

export type MetricsPoint = { dia: string; valor: number };
export type MetricsData = { total: number; puntos: MetricsPoint[]; actualizado: number };

const API_BASE = (
  import.meta.env.VITE_CV_VISITORS_API_URL ||
  "https://cv-visitors-api.cv-visitor-worker.workers.dev"
).replace(/\/$/, "");

const TTL_MS = 5 * 60 * 1000;
const DIAS_VENTANA = 7;
const SS_METRICAS = "et-metricas-cache";
const SS_EVENTOS = "et-metricas-eventos";
const MAX_EVENTOS = 500;

let memoria: MetricsData | null = null;
let eventosSesion = leerEventosGuardados();
let refrescando = false;

const metricSubs = new Set<(data: MetricsData) => void>();
const eventoSubs = new Set<(n: number) => void>();

function leerEventosGuardados(): number {
  try {
    const raw = sessionStorage.getItem(SS_EVENTOS);
    return raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function esValido(data: unknown): data is MetricsData {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Partial<MetricsData>;
  return Array.isArray(candidate.puntos) && typeof candidate.total === "number";
}

function ventana7(dias: Map<string, number>): MetricsPoint[] {
  const puntos: MetricsPoint[] = [];
  for (let i = DIAS_VENTANA - 1; i >= 0; i--) {
    const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const clave = fecha.toISOString().slice(0, 10);
    puntos.push({
      dia: fecha.toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" }),
      valor: dias.get(clave) ?? 0,
    });
  }
  return puntos;
}

export function ventanaVacia(): MetricsPoint[] {
  return ventana7(new Map());
}

function normalizar(payload: unknown): MetricsData {
  const dias = new Map<string, number>();
  const fuente = (payload as { dias?: unknown } | null)?.dias;
  if (Array.isArray(fuente)) {
    for (const item of fuente) {
      const dia = (item as { dia?: unknown })?.dia;
      const valor = (item as { valor?: unknown })?.valor;
      if (typeof dia === "string" && typeof valor === "number") dias.set(dia, valor);
    }
  }

  const puntos = ventana7(dias);
  const total = puntos.reduce((sum, punto) => sum + punto.valor, 0);

  return { total, puntos, actualizado: Date.now() };
}

function setCache(data: MetricsData) {
  memoria = data;
  try {
    sessionStorage.setItem(SS_METRICAS, JSON.stringify(data));
  } catch {
    /* La caché de sesión es opcional; la memoria basta para esta visita. */
  }
  metricSubs.forEach((listener) => listener(data));
}

export function getCache(): MetricsData | null {
  if (memoria) return memoria;
  try {
    const raw = sessionStorage.getItem(SS_METRICAS);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (esValido(parsed)) {
        memoria = parsed;
        return parsed;
      }
    }
  } catch {
    /* Sin caché de sesión se consulta una sola vez. */
  }
  return null;
}

async function refrescar(): Promise<MetricsData | null> {
  if (refrescando) return getCache();
  refrescando = true;
  try {
    const res = await fetch(`${API_BASE}/api/cv-visitors/stats`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("stats unavailable");
    const data = normalizar(await res.json());
    setCache(data);
    return data;
  } catch {
    return getCache();
  } finally {
    refrescando = false;
  }
}

export function cargarMetricas(force = false): Promise<MetricsData | null> {
  const cache = getCache();
  const fresco = cache ? Date.now() - cache.actualizado < TTL_MS : false;
  if (cache && !force && fresco) return Promise.resolve(cache);
  if (cache && !force) {
    void refrescar();
    return Promise.resolve(cache);
  }
  return refrescar();
}

export function subscribeMetricas(listener: (data: MetricsData) => void) {
  metricSubs.add(listener);
  return () => {
    metricSubs.delete(listener);
  };
}

export function eventosSesionActuales(): number {
  return eventosSesion;
}

export function subscribeEventos(listener: (n: number) => void) {
  eventoSubs.add(listener);
  return () => {
    eventoSubs.delete(listener);
  };
}

function guardarEventos(n: number) {
  eventosSesion = Math.max(0, Math.min(MAX_EVENTOS, n));
  try {
    sessionStorage.setItem(SS_EVENTOS, String(eventosSesion));
  } catch {
    /* El contador vive en memoria durante la sesión. */
  }
  eventoSubs.forEach((listener) => listener(eventosSesion));
}

export function registrarEvento(n = 1) {
  if (n <= 0) return;
  guardarEventos(eventosSesion + n);
}

let visitaContada = false;

export function registrarVisita() {
  if (visitaContada) return;
  visitaContada = true;
  registrarEvento(1);
}

export function enviarMetricas() {
  const eventos = eventosSesion;
  if (eventos <= 0) return;
  if (getParticipation() !== "participar") return;
  const body = JSON.stringify({ seed: seedDeSesion(), events: eventos });
  const url = `${API_BASE}/api/cv-visitors`;
  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(url, blob)) {
        guardarEventos(0);
        return;
      }
    }
  } catch {
    /* Se intenta con fetch keepalive. */
  }
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    guardarEventos(0);
  } catch {
    /* La métrica se reintenta en el siguiente punto estratégico. */
  }
}

export function iniciarAutoflush(): () => void {
  const flush = () => enviarMetricas();
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flush);
  };
}

export function useMetricas() {
  const [data, setData] = useState<MetricsData | null>(() => getCache());
  const [cargando, setCargando] = useState(false);

  useEffect(() => subscribeMetricas(setData), []);

  useEffect(() => {
    let activo = true;
    if (!getCache()) setCargando(true);
    void cargarMetricas().then((resultado) => {
      if (activo) {
        if (resultado) setData(resultado);
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  return { data, cargando, recargar: () => cargarMetricas(true) };
}

export function useEventosSesion() {
  const [eventos, setEventos] = useState(eventosSesionActuales());
  useEffect(() => subscribeEventos(setEventos), []);
  return eventos;
}
