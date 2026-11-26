"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Perkakas gerak ala mesin Motion Format: semua posisi dihitung dari waktu t.
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const E = {
  out: (k: number) => 1 - (1 - k) ** 3,
  in: (k: number) => k ** 3,
  io: (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
  back: (k: number) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2,
};
// Goyang halus -1..1 yang selalu sama untuk t dan benih yang sama.
export const nz = (t: number, seed = 0) =>
  (Math.sin(t * 1.7 + seed * 12.9) + Math.sin(t * 2.9 + seed * 7.3) * 0.6 + Math.sin(t * 4.3 + seed * 3.1) * 0.3) / 1.9;

export type Frame = (ctx: CanvasRenderingContext2D, t: number, size: { w: number; h: number; font: string }) => void;

// Menggambar ulang kanvas tiap frame dari t. Berhenti saat tidak terlihat, saat dijeda,
// dan diam di satu frame bila pengguna memilih kurangi gerak.
export function useCanvasScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  frame: Frame,
  options: { dur: number; stillAt: number; playing: boolean },
) {
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);
  const clockRef = useRef({ t: 0, last: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;

    const draw = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      frameRef.current(ctx, t, { w: rect.width, h: rect.height, font: getComputedStyle(canvas).fontFamily });
    };

    const tick = (now: number) => {
      const clock = clockRef.current;
      if (clock.last) clock.t = (clock.t + Math.min(now - clock.last, 100) / 1000) % options.dur;
      clock.last = now;
      draw(clock.t);
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      clockRef.current.last = 0;
    };
    const sync = () => {
      stop();
      if (reduce || !options.playing) draw(reduce ? options.stillAt : clockRef.current.t);
      else if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    const onResize = () => !raf && draw(reduce ? options.stillAt : clockRef.current.t);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", sync);
    document.fonts?.ready.then(() => !raf && draw(reduce ? options.stillAt : clockRef.current.t));
    sync();
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [canvasRef, options.dur, options.stillAt, options.playing]);
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduce;
}
