import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, FileText, X } from "lucide-react";
import { registrarEvento } from "@/components/metricas";
import { setOverlayOpen } from "@/components/overlay-state";
import {
  getParticipation,
  setParticipation,
  subscribeParticipation,
} from "@/components/participacion";
import { seedDeSesion, seudonimo } from "@/components/seudonimo";
import { scrollToStation } from "@/components/use-depth-motion";

export default function CVAccessDialog({ cvUrl, onClose }: { cvUrl: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [alias] = useState(() => seudonimo(seedDeSesion()));
  const [participation, setLocalParticipation] = useState(() => getParticipation());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => subscribeParticipation(setLocalParticipation), []);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previousFocus?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    setOverlayOpen(true);
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      setOverlayOpen(false);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (viewerOpen) closeRef.current?.focus();
  }, [viewerOpen]);

  const abrirCuenta = () => {
    setParticipation("participar");
    registrarEvento(1);
    setViewerOpen(true);
  };

  const abrirSinCuenta = () => {
    setParticipation("no-participar");
    setViewerOpen(true);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      dialog?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || !dialog?.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !dialog?.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="cv-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
    >
      <section
        ref={dialogRef}
        className="cv-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-dialog-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="cv-dialog-content">
          <header className="cv-dialog-header">
            <div>
              <p className="text-xs font-medium tracking-widest text-muted uppercase">
                Currículum Vitae
              </p>
              <h2 id="cv-dialog-title" className="mt-2 font-display text-2xl leading-tight">
                Eduardo Téllez Valverde
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="press grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg"
              aria-label="Cerrar ventana"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>
          {!viewerOpen ? (
            <div className="mt-6">
              <p className="text-sm text-muted">
                El CV es libre: puedes verlo o descargarlo sin dar tu nombre. Si además sumas tu
                visita a la métrica pública, esta cuenta como{" "}
                <span className="font-medium text-fg">“{alias}”</span> — un número anónimo, sin
                datos personales.
              </p>
              <button
                type="button"
                onClick={abrirCuenta}
                className="press mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent px-5 font-medium text-accent-fg"
              >
                <Eye className="size-4" aria-hidden="true" />
                Ver el CV y que cuente
              </button>
              <button
                type="button"
                onClick={abrirSinCuenta}
                className="press mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-surface px-5 text-sm font-medium text-fg"
              >
                Ver el CV sin contar
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                {participation === null
                  ? "Aún no eliges si tu visita cuenta."
                  : participation === "participar"
                    ? "Ahora mismo tu visita sí cuenta."
                    : "Ahora mismo tu visita no cuenta."}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.requestAnimationFrame(() => scrollToStation("transparencia"));
                }}
                className="mt-2 block w-full text-center text-xs text-muted underline decoration-line underline-offset-4 hover:text-fg"
              >
                Cómo usamos tus datos
              </button>
            </div>
          ) : (
            <section className="mt-5" aria-label="Visor del currículum">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <FileText className="size-4" aria-hidden="true" />
                  CV Eduardo Téllez Valverde
                </p>
                <a
                  href={cvUrl}
                  download
                  className="press inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-fg"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Descargar PDF
                </a>
              </div>
              <div className="relative">
                {!loaded && (
                  <div className="absolute inset-0 z-10 grid place-items-center rounded-xl border border-line bg-surface">
                    <span className="text-sm text-muted">Cargando PDF...</span>
                  </div>
                )}
                <iframe
                  src={cvUrl}
                  title="Currículum de Eduardo Téllez Valverde"
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                  className="cv-dialog-frame"
                />
              </div>
            </section>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
