import { useEffect, useRef, type RefObject } from "react";
import type { MotionState } from "@/components/motion-state";

export function scrollToStation(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
  });
}

export function useDepthMotion(
  motion: RefObject<MotionState>,
  onIndex: (index: number) => void,
  barRef: RefObject<HTMLDivElement | null>,
) {
  const onIndexRef = useRef(onIndex);
  onIndexRef.current = onIndex;

  useEffect(() => {
    const state = motion.current;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = { px: 0, py: 0 };
    let lastIndex = -1;
    let frame = 0;
    let alive = true;
    let isTyping = false;

    const stations = [...document.querySelectorAll<HTMLElement>("[data-station]")];
    const cards = stations.map((el) => el.querySelector<HTMLElement>("[data-card]"));
    const beats = [...document.querySelectorAll<HTMLElement>("[data-beat]")];

    const applyReduced = () => {
      state.reduced = reducedQuery.matches;
      if (state.reduced) {
        cards.forEach((card) => {
          if (!card) return;
          card.style.transform = "none";
          card.style.opacity = "1";
        });
        beats.forEach((beat) => beat.classList.remove("is-hot"));
      }
    };
    applyReduced();

    const onPointer = (event: PointerEvent) => {
      target.px = (event.clientX / window.innerWidth) * 2 - 1;
      target.py = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const resetTouch = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      target.px = 0;
      target.py = 0;
    };
    const leave = () => {
      target.px = 0;
      target.py = 0;
    };

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      if (!alive) return;
      const damp = state.reduced ? 1 : 0.16;
      state.px += (target.px - state.px) * damp;
      state.py += (target.py - state.py) * damp;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      state.scroll = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${state.scroll})`;

      const height = window.innerHeight || 1;
      let closest = 0;
      let best = Infinity;
      const typing = isTyping;

      stations.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const dist = (rect.top + rect.height * 0.5 - height * 0.5) / height;
        const ad = Math.min(Math.abs(dist), 1.4);
        const card = cards[index];
        if (card && !state.reduced && !typing && el.dataset.reveal !== "static") {
          const slack = Math.max(0, ad - 0.07);
          const t = Math.min(1, slack / 0.55);
          const away = t * t * (3 - 2 * t);
          const dir = dist < 0 ? -1 : 1;
          const rz = -away * 480;
          const rx = away * dir * -24;
          const ty = away * dir * 24;
          const transform = `translate3d(0px, ${ty.toFixed(2)}px, ${rz.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg)`;
          const opacity = (1 - away).toFixed(3);
          if (card.style.transform !== transform) card.style.transform = transform;
          if (card.style.opacity !== opacity) card.style.opacity = opacity;
        } else if (card && el.dataset.reveal === "static") {
          if (card.style.transform) card.style.transform = "";
          if (card.style.opacity !== "1") card.style.opacity = "1";
        }
        if (ad < best) {
          best = ad;
          closest = index;
        }
      });

      if (!state.reduced && beats.length > 0) {
        const active = Math.round(((state.px + 1) / 2) * (beats.length - 1));
        const clamped = Math.min(beats.length - 1, Math.max(0, active));
        beats.forEach((beat, index) => beat.classList.toggle("is-hot", index === clamped));
      }

      if (closest !== lastIndex) {
        lastIndex = closest;
        onIndexRef.current(closest);
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const el = event.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) {
        isTyping = true;
      }
    };
    const onFocusOut = () => {
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        const tag = active?.tagName;
        const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || active?.isContentEditable;
        isTyping = Boolean(typing);
      });
    };

    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "A" || tag === "BUTTON" || el?.isContentEditable) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "PageDown" && event.key !== "PageUp") {
        return;
      }
      event.preventDefault();
      const dir = event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1;
      const next = Math.min(stations.length - 1, Math.max(0, lastIndex + dir));
      const id = stations[next]?.id;
      if (id) scrollToStation(id);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerup", resetTouch);
    window.addEventListener("pointercancel", resetTouch);
    window.addEventListener("blur", leave);
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    reducedQuery.addEventListener("change", applyReduced);
    frame = window.requestAnimationFrame(tick);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", resetTouch);
      window.removeEventListener("pointercancel", resetTouch);
      window.removeEventListener("blur", leave);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      isTyping = false;
      reducedQuery.removeEventListener("change", applyReduced);
    };
  }, [barRef, motion]);
}
