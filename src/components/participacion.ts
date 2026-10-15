export type Participation = "participar" | "no-participar";

type Listener = (value: Participation) => void;

const STORAGE_KEY = "et-participacion";
const listeners = new Set<Listener>();

export function getParticipation(): Participation | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "participar" || value === "no-participar" ? value : null;
  } catch {
    return null;
  }
}

export function setParticipation(value: Participation) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Sin almacenamiento local la elección vale solo para esta sesión. */
  }
  listeners.forEach((listener) => listener(value));
}

export function subscribeParticipation(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
