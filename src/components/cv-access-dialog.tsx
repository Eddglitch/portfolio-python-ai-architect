import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, X } from "lucide-react";

export default function CVAccessDialog({ cvUrl, onClose }: { cvUrl: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [visitorName, setVisitorName] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    // Keep initial focus off the text input; focusing it on launch reproduces the original freeze.
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => { if (viewerOpen) closeRef.current?.focus(); }, [viewerOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const name = visitorName.trim();
    if (!name) return;
    setSubmitting(true);
    setRegistrationMessage("");
    try {
      const apiUrl = (import.meta.env.VITE_CV_VISITORS_API_URL || "https://cv-visitors-api.cv-visitor-worker.workers.dev").replace(/\/$/, "");
      const response = await fetch(apiUrl + "/api/cv-visitors", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("registration failed");
      setRegistrationMessage("Solicitud registrada.");
    } catch {
      setRegistrationMessage("No se pudo registrar en línea; puedes continuar al CV.");
    }
    try {
      localStorage.setItem("et-cv-visitor", name);
      localStorage.setItem("et-cv-timestamp", Date.now().toString());
    } catch { /* El visor sigue disponible sin almacenamiento local. */ }
    setSubmitting(false);
    setViewerOpen(true);
  };

  return createPortal(
    <dialog ref={dialogRef} className="cv-dialog" aria-labelledby="cv-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="cv-dialog-content">
        <header className="cv-dialog-header">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted uppercase">Currículum Vitae</p>
            <h2 id="cv-dialog-title" className="mt-2 font-display text-2xl leading-tight">Eduardo Téllez Valverde</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="press grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg" aria-label="Cerrar ventana">
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        {!viewerOpen ? (
          <form onSubmit={handleSubmit} className="mt-6">
            <p className="text-sm text-muted">Para visualizar el CV, indícanos tu nombre u organización. Si prefieres no identificarte, puedes escribir “unknown”.</p>
            <p className="mt-3 text-xs text-muted">El nombre y la fecha se enviarán a Cloudflare para contabilizar esta solicitud. No incluyas información sensible.</p>
            <label className="mt-4 flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" required checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
              <span>Autorizo el registro de este nombre para contabilizar la solicitud de visualización del CV.</span>
            </label>
            <label className="mt-4 block text-sm font-medium text-fg" htmlFor="cv-visitor-name">Nombre / Organización</label>
            <input id="cv-visitor-name" type="text" value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)} placeholder="Nombre / Organización"
              required minLength={1} maxLength={120}
              className="cv-field mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-4 py-2 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              autoComplete="organization" enterKeyHint="done" />
            <button type="submit" disabled={submitting} className="press mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent px-5 font-medium text-accent-fg disabled:opacity-60">
              <FileText className="size-4" aria-hidden="true" />{submitting ? "Registrando..." : "Registrar y visualizar CV"}
            </button>
            {registrationMessage && <p role="status" className="mt-3 text-xs text-muted">{registrationMessage}</p>}
          </form>
        ) : (
          <section className="mt-5" aria-label="Visor del currículum">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted"><FileText className="size-4" aria-hidden="true" />CV Eduardo Téllez Valverde</p>
              <a href={cvUrl} download className="press inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-fg"><Download className="size-4" aria-hidden="true" />Descargar PDF</a>
            </div>
            <div className="relative">
              {!loaded && <div className="absolute inset-0 z-10 grid place-items-center rounded-xl border border-line bg-surface"><span className="text-sm text-muted">Cargando PDF...</span></div>}
              <iframe src={cvUrl} title="Currículum de Eduardo Téllez Valverde" loading="lazy" onLoad={() => setLoaded(true)} className="cv-dialog-frame" />
            </div>
          </section>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
