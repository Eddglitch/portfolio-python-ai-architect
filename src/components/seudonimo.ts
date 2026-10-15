const ADJETIVOS = [
  "Zorro",
  "Pingüino",
  "Cóndor",
  "Jaguar",
  "Tucán",
  "Colibrí",
  "Ajolote",
  "Vaquita",
  "Mapache",
  "Puma",
  "Lince",
  "Nutria",
  "Tejón",
  "Albatros",
  "Flamenco",
  "Peregrino",
] as const;

const COLORES = [
  "Naranja",
  "Turquesa",
  "Carmesí",
  "Dorado",
  "Plateado",
  "Índigo",
  "Esmeralda",
  "Cobalto",
  "Ámbar",
  "Escarlata",
  "Violeta",
  "Añil",
  "Coral",
  "Bronce",
  "Lila",
  "Ocre",
] as const;

const SEED_KEY = "et-seed";

export function seudonimo(seed: number): string {
  const s = Math.abs(Math.trunc(seed)) || 1;
  const adjetivo = ADJETIVOS[s % ADJETIVOS.length];
  const color = COLORES[Math.floor(s / ADJETIVOS.length) % COLORES.length];
  const numero = (s % 90) + 10;
  return `${adjetivo} ${color} ${numero}`;
}

export function nuevoSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export function seedDeSesion(): number {
  try {
    const guardado = sessionStorage.getItem(SEED_KEY);
    if (guardado && /^\d+$/.test(guardado)) return Number(guardado);
    const seed = nuevoSeed();
    sessionStorage.setItem(SEED_KEY, String(seed));
    return seed;
  } catch {
    return nuevoSeed();
  }
}
