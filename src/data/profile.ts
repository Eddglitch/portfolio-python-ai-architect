import type { LucideIcon } from "lucide-react";
import { Cloud, Landmark, Network, Waypoints } from "lucide-react";

export const profile = {
  name: "Eduardo Téllez Valverde",
  given: "Eduardo Téllez",
  family: "Valverde",
  role: "Desarrollador Python avanzado",
  line: "IA aplicada · Sistemas RAG · Cloud y fintech",
  bio: "Diseño sistemas RAG, pipelines fiscales CFDI/SAT y arquitecturas híbridas sobre Azure, AWS e inferencia local. El criterio es el mismo en todos: observables, trazables y predecibles cuando el dato es sensible.",
  location: "Estado de México / CDMX",
  email: "eduardotelv@gmail.com",
  phoneDisplay: "56 5139 8264",
  whatsapp: "https://wa.me/525651398264",
  linkedin: "https://www.linkedin.com/in/eduardo-telv",
  github: "https://github.com/Eddglitch",
  cv: "/cv-eduardo-tellez-valverde.pdf",
};

export type Beat = {
  k: string;
  t: string;
  d: string;
};

export const beats: Beat[] = [
  {
    k: "01",
    t: "RAG",
    d: "Búsqueda semántica con guardrails y un audit trail que se puede revisar.",
  },
  {
    k: "02",
    t: "CFDI",
    d: "Riesgo crediticio: concentración, aging, cancelaciones y nómina.",
  },
  {
    k: "03",
    t: "Cloud",
    d: "Azure AI Foundry y Blob, junto con AWS S3, sin perder el rastro del dato.",
  },
  {
    k: "04",
    t: "Local",
    d: "Ollama y CUDA cuando la inferencia tiene que quedarse en casa.",
  },
];

export type WorkItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  icon: LucideIcon;
  points: string[];
};

export const work: WorkItem[] = [
  {
    id: "syntage",
    title: "Syntage-Bridge y CFDI",
    subtitle: "789.mx / Fluxo Fintech · 2026",
    meta: "Middleware fiscal en producción",
    icon: Waypoints,
    points: [
      "Arquitectura FastAPI: de RFC a entity_id, con endpoints REST para datos fiscales y la API de Syntage.",
      "Pipeline de riesgo crediticio con módulos de concentración, aging, cancelaciones y nómina.",
      "Dashboard ejecutivo determinístico, armado para operar con datos sensibles.",
    ],
  },
  {
    id: "rag",
    title: "Sistemas RAG",
    subtitle: "Independiente · 2023–2026",
    meta: "FastAPI + ChromaDB",
    icon: Network,
    points: [
      "RAG sobre PDF, APIs, código y Markdown, con búsqueda semántica, guardrails y audit trail.",
      "Enrutamiento entre Claude, Gemini y Ollama, e inferencia local con CUDA para datos sensibles.",
      "Ingesta modular: hooks de validación, manejo de errores, trazabilidad y versionado en Git.",
    ],
  },
  {
    id: "cloud",
    title: "Cloud híbrido e inferencia local",
    subtitle: "Azure AI Foundry · AWS · Ollama",
    meta: "El modelo no es el sistema",
    icon: Cloud,
    points: [
      "LLM sobre CFDI con RAG para reportes ejecutivos automatizados en Azure AI Foundry.",
      "Almacenamiento en Azure Blob Storage y AWS S3.",
      "Capa de confiabilidad con guardrails, hooks y audit trail; Ollama + CUDA cuando el dato no sale.",
    ],
  },
  {
    id: "invi",
    title: "INVI · OCR y geodatos",
    subtitle: "Vivienda CDMX · 2021–2023",
    meta: "Automatización institucional",
    icon: Landmark,
    points: [
      "OCR para expedientes físicos heterogéneos: menos carga manual y más consistencia operativa.",
      "Pipelines geoespaciales en KML, GeoJSON, CSV y XLSX.",
      "Validación por etapas, logs y fuzzy matching para conciliar datos institucionales.",
    ],
  },
];
