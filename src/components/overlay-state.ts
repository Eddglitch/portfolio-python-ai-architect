type OverlayListener = (open: boolean) => void;

let open = false;
const listeners = new Set<OverlayListener>();

export function isOverlayOpen() {
  return open;
}

export function setOverlayOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener(open));
}

export function subscribeOverlay(listener: OverlayListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
