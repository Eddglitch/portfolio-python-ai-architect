import { useRef, useState, useEffect, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, FileDown, Github, Linkedin, Mail, Moon, Sun } from "lucide-react";
import { FractalCanvas } from "@/components/fractal-canvas";
import CVAccessDialog from "@/components/cv-access-dialog";
import type { MotionState } from "@/components/motion-state";
import { ProjectDiagrams } from "@/components/project-diagrams";
import { scrollToStation, useDepthMotion } from "@/components/use-depth-motion";
import { beats, profile, work, type WorkItem } from "@/data/profile";

const CHAPTERS = [
  { id: "senal", label: "Señal" },
  { id: "perfil", label: "Perfil" },
  { id: "enfoque", label: "Enfoque" },
  { id: "syntage", label: "CFDI" },
  { id: "rag", label: "RAG" },
  { id: "cloud", label: "Cloud" },
  { id: "invi", label: "INVI" },
  { id: "cv", label: "CV" },
  { id: "contacto", label: "Contacto" },
] as const;

const SOCIAL = [
  { label: "LinkedIn", href: profile.linkedin, icon: Linkedin },
  { label: "GitHub", href: profile.github, icon: Github },
  { label: "Correo", href: `mailto:${profile.email}`, icon: Mail },
] as const;

function ThemeToggle() {
  const sunRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("et-theme");
    const dark = stored === "dark" || (stored === null); // default dark
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";

    if (!dark && sunRef.current) {
      let count = 0;
      const interval = setInterval(() => {
        if (sunRef.current) {
          sunRef.current.style.opacity = count % 2 === 0 ? "0" : "1";
        }
        count++;
        if (count >= 6) {
          clearInterval(interval);
          if (sunRef.current) sunRef.current.style.opacity = "1";
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const apply = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("et-theme", dark ? "dark" : "light");
    } catch {
      /* ignore private mode */
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambiar tema"
        className="link-press grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
      >
        <Moon className="size-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => apply(!document.documentElement.classList.contains("dark"))}
      className="link-press grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
    >
      <Sun ref={sunRef} className="hidden size-5 dark:block" aria-hidden="true" style={{ transition: "opacity 200ms" }} />
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.95c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.2-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.28.64-.41 1.02-.41.12 0 .23 0 .33.01.3.01.45.03.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.37-.42.5-.14.14-.28.28-.12.54.16.26.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.23 1.37.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.19-.28.37-.23.62-.14.26.09 1.62.76 1.9.9.28.14.46.2.53.32.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

function ExternalRow({
  href,
  title,
  subtitle,
  icon,
  primary = false,
  download = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  primary?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      {...(download
        ? { download: true }
        : href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      className={
        "link-press group flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-3 " +
        (primary
          ? "border-accent bg-accent text-accent-fg"
          : "border-line bg-surface text-fg hover:border-accent")
      }
    >
      <span
        className={
          "grid size-11 shrink-0 place-items-center rounded-xl " +
          (primary ? "bg-accent-fg/15 text-accent-fg" : "bg-soft text-accent")
        }
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-medium text-balance">{title}</span>
        <span className={"block text-sm " + (primary ? "text-accent-fg/80" : "text-muted")}>{subtitle}</span>
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  );
}

function Station({
  id,
  reveal = "depth",
  className = "",
  children,
}: {
  id: string;
  reveal?: "static" | "depth";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-station data-reveal={reveal} className={"station " + className}>
      <div data-card className="station-card">
        {children}
      </div>
    </section>
  );
}

function WorkStation({ item }: { item: WorkItem }) {
  const Icon = item.icon;
  return (
    <div className="panel px-5 py-6 sm:px-7">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">{item.subtitle}</p>
      <div className="mt-4 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-tight text-balance">{item.title}</h2>
          <p className="mt-1 font-display text-sm text-accent">{item.meta}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {item.points.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-pretty text-fg/90">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CVStation() {
  const cvUrl = `${import.meta.env.BASE_URL}cv-eduardo-tellez-valverde.pdf`;
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Station id="cv" reveal="static" className="cv-station">
      <div className="cv-station-band">
        <div className="cv-station-content">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Currículum Vitae</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-balance">Perfil profesional completo</h2>
          <p className="mt-4 max-w-2xl text-sm text-muted">Abre el CV en una ventana enfocada. El formulario y el visor solo se cargan cuando los necesitas.</p>
          <button type="button" onClick={() => setDialogOpen(true)} className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-accent bg-accent px-5 font-medium text-accent-fg">
            <FileDown className="size-4" aria-hidden="true" />Abrir currículum
          </button>
        </div>
      </div>
      {dialogOpen && <CVAccessDialog cvUrl={cvUrl} onClose={() => setDialogOpen(false)} />}
    </Station>
  );
}

export function BioPage() {
  const motion = useRef<MotionState>({ scroll: 0, px: 0, py: 0, reduced: false });
  const barRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useDepthMotion(
    motion,
    (next) => {
      if (indexRef.current === next) return;
      indexRef.current = next;
      setIndex(next);
    },
    barRef,
  );

  const atEnd = index >= CHAPTERS.length - 1;
  const chapter = CHAPTERS[index] ?? CHAPTERS[0];

  return (
    <div className="relative">
      <FractalCanvas motion={motion} />
      <div className="scrim" aria-hidden="true" />
      <ProjectDiagrams activeId={chapter.id} />

      <div className="fixed inset-x-0 top-0 z-40 h-0.5">
        <div ref={barRef} className="h-full w-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pt-4">
        <p className="min-w-0 truncate text-xs font-medium tracking-widest text-muted uppercase">
          {String(index + 1).padStart(2, "0")}
          <span className="px-1.5">/</span>
          {String(CHAPTERS.length).padStart(2, "0")}
          <span className="px-2 text-fg">{chapter.label}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToStation(atEnd ? CHAPTERS[0].id : CHAPTERS[index + 1].id)}
            aria-label={atEnd ? "Volver al inicio" : `Avanzar a ${CHAPTERS[index + 1].label}`}
            className="press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-fg"
          >
            {atEnd ? "Inicio" : "Avance"}
            {atEnd ? <ArrowUp className="size-4" aria-hidden="true" /> : <ArrowDown className="size-4" aria-hidden="true" />}
          </button>
          <ThemeToggle />
        </div>
      </header>

      <nav aria-label="Estaciones" className="fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 lg:block">
        <ol className="flex flex-col">
          {CHAPTERS.map((item, itemIndex) => {
            const current = itemIndex === index;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={current ? "step" : undefined}
                  onClick={() => scrollToStation(item.id)}
                  className="press flex min-h-11 items-center gap-3 text-left"
                >
                  <span className={"size-1.5 rounded-full " + (current ? "bg-accent" : "bg-line")} aria-hidden="true" />
                  <span className={"text-xs font-medium tracking-widest uppercase " + (current ? "text-fg" : "text-muted")}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <main>
        <Station id="senal" reveal="static">
          <div className="panel px-6 py-8 text-center sm:px-8">
            <p className="text-xs font-medium tracking-widest text-muted uppercase">Señal · CDMX</p>
            <div className="mx-auto mt-5 grid size-24 place-items-center rounded-full border border-accent/50 bg-soft">
              <span className="font-display text-4xl leading-none">ET</span>
            </div>
            <h1 className="mt-5 font-display text-4xl leading-none font-medium text-balance sm:text-5xl">
              {profile.given}
              <span className="mt-1 block">{profile.family}</span>
            </h1>
            <p className="mt-4 text-sm font-medium tracking-wide text-accent uppercase">{profile.role}</p>
            <p className="mt-1 text-sm text-muted">{profile.line}</p>
            <p className="mx-auto mt-5 max-w-sm text-sm text-pretty text-muted">
              El fondo acompaña, no compite. Algunas estaciones se quedan quietas; los proyectos entran y salen en profundidad, con su diagrama fijo al margen.
            </p>
          </div>
        </Station>

        <Station id="perfil" reveal="static">
          <div className="panel px-6 py-7 text-center sm:px-8">
            <p className="text-xs font-medium tracking-widest text-muted uppercase">Perfil</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-balance">Sistemas que se pueden auditar</h2>
            <p className="mt-4 text-pretty text-fg/90">{profile.bio}</p>
            <p className="mt-4 text-sm text-muted">{profile.location}</p>
            <div className="mt-5 flex justify-center gap-2">
              {SOCIAL.map((item) => {
                const Icon = item.icon;
                const external = item.href.startsWith("http");
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="link-press grid size-11 place-items-center rounded-full border border-line bg-surface text-fg hover:border-accent hover:text-accent"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </a>
                );
              })}
              <a
                href={profile.whatsapp}
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="link-press grid size-11 place-items-center rounded-full border border-line bg-surface text-fg hover:border-accent hover:text-accent"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>
        </Station>

        <Station id="enfoque">
          <div className="panel px-5 py-6 sm:px-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-widest text-muted uppercase">Enfoque</p>
                <h2 className="mt-2 font-display text-3xl leading-tight">Cuatro ejes</h2>
              </div>
              <p className="text-xs text-muted">El cursor cambia el eje activo</p>
            </div>
            <ol className="mt-5 flex flex-col gap-2.5">
              {beats.map((beat) => (
                <li key={beat.k} data-beat className="beat rounded-2xl border bg-surface px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-2xl leading-none">{beat.t}</p>
                    <p className="font-display text-sm text-accent tabular-nums">{beat.k}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-pretty text-muted">{beat.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </Station>

        {work.map((item) => (
          <Station key={item.id} id={item.id}>
            <WorkStation item={item} />
          </Station>
        ))}

        <CVStation />

        <Station id="contacto" reveal="static">
          <div className="panel px-5 py-6 sm:px-7">
            <p className="text-xs font-medium tracking-widest text-muted uppercase">Contacto</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-balance">Seguimos en la misma señal</h2>
            <div className="mt-5 flex flex-col gap-2.5">
              <ExternalRow
                primary
                href={profile.whatsapp}
                title="Mensaje directo"
                subtitle={`WhatsApp · ${profile.phoneDisplay}`}
                icon={<WhatsAppIcon />}
              />
              <ExternalRow
                download
                href={profile.cv}
                title="Currículum · junio 2026"
                subtitle="PDF de una página"
                icon={<FileDown className="size-5" aria-hidden="true" />}
              />
              <ExternalRow href={`mailto:${profile.email}`} title={profile.email} subtitle="Correo" icon={<Mail className="size-5" aria-hidden="true" />} />
            </div>
            <footer className="mt-6 space-y-1.5 text-center text-sm text-muted">
              <p>
                <a className="underline decoration-line underline-offset-4 hover:text-fg" href={`tel:+52${profile.phoneDisplay.replace(/\s/g, "")}`}>
                  {profile.phoneDisplay}
                </a>
              </p>
              <p>Ingeniería en Informática · UPIICSA · IPN</p>
              <p>Scrum Fundamentals Certified · 2024</p>
              <p>Español nativo · Inglés de lectura técnica</p>
            </footer>
          </div>
        </Station>
      </main>
    </div>
  );
}
