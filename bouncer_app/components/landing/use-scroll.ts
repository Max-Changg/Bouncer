'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks scroll progress (0–1) through a pinned section and writes it to the
 * element as a `--p` CSS custom property every animation frame, so element
 * choreography can live entirely in CSS. Progress is 0 while the section's top
 * is below the viewport top and 1 once its bottom reaches the viewport bottom.
 */
export function useScrollProgress<T extends HTMLElement>(
  onProgress?: (p: number) => void
) {
  const ref = useRef<T | null>(null);
  const callbackRef = useRef(onProgress);
  callbackRef.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const range = el.offsetHeight - window.innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      el.style.setProperty('--p', p.toFixed(4));
      callbackRef.current?.(p);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
