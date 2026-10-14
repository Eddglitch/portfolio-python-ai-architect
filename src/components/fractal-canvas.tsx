import { useEffect, useRef, type RefObject } from "react";
import type { MotionState } from "@/components/motion-state";

export function FractalCanvas({ motion }: { motion: RefObject<MotionState> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const state = motion.current;
    if (!canvas) return;
    let cancel = false;
    let cleanup = () => {};
    void import("@/components/mount-fractal").then((mod) => {
      if (cancel || !ref.current) return;
      cleanup = mod.mountFractal(ref.current, state);
    });
    return () => {
      cancel = true;
      cleanup();
    };
  }, [motion]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-dvh w-full" aria-hidden="true" />;
}
