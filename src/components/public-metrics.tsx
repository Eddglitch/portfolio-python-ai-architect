import { RefreshCw } from "lucide-react";
import { ventanaVacia, type MetricsData } from "@/components/metricas";

export function PublicMetrics({
  data,
  cargando = false,
  onRecargar,
}: {
  data: MetricsData | null;
  cargando?: boolean;
  onRecargar?: () => void;
}) {
  const puntos = data && data.puntos.length > 0 ? data.puntos : ventanaVacia();
  const total = data?.total ?? 0;
  const max = Math.max(1, ...puntos.map((punto) => punto.valor));
  const descripcion = puntos.map((punto) => `${punto.dia}: ${punto.valor}`).join(", ");

  return (
    <div className="mt-5 rounded-2xl border border-line bg-soft px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-4xl leading-none tabular-nums">{total}</p>
        <div className="text-right">
          <p className="text-xs text-muted">visitas anónimas · últimos 7 días</p>
          {onRecargar && (
            <button
              type="button"
              onClick={onRecargar}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted underline decoration-line underline-offset-4 hover:text-fg"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              actualizar
            </button>
          )}
        </div>
      </div>
      <ul
        className="mt-4 flex items-end gap-1.5"
        role="img"
        aria-label={`Visitas anónimas por día — ${descripcion}`}
      >
        {puntos.map((punto) => (
          <li key={punto.dia} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="w-full rounded-sm bg-accent/80"
              style={{ height: `${Math.max(3, (punto.valor / max) * 62)}px` }}
            />
            <span className="text-[0.6rem] tracking-widest text-muted uppercase">{punto.dia}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        {cargando
          ? "Actualizando…"
          : "Solo conteos agregados. Nunca mostramos nombres ni datos individuales."}
      </p>
    </div>
  );
}
