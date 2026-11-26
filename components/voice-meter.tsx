"use client";

import { useRef } from "react";
import { nz, useCanvasScene, type Frame } from "@/lib/motion";

// Gelombang suara di bar telepon. Tinggi batang diambil dari mikrofon (saat mendengarkan)
// atau dari suara agent (saat bicara); bila tidak ada sinyal, batang bergerak pelan.
export function VoiceMeter({ getAnalyser, active }: { getAnalyser: () => AnalyserNode | null; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const frame: Frame = (ctx, t, { w, h }) => {
    const analyser = getAnalyser();
    const bars = Math.max(12, Math.floor(w / 9));
    let levels: number[] | null = null;
    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataRef.current);
      const data = dataRef.current;
      levels = Array.from({ length: bars }, (_, i) => data[Math.floor((i / bars) * data.length * 0.6)] / 255);
    }
    ctx.fillStyle = "#ffd400";
    for (let i = 0; i < bars; i++) {
      const idle = 0.12 + Math.abs(nz(t * 2 + i * 0.4, i)) * (active ? 0.35 : 0.1);
      const level = levels ? Math.max(0.08, levels[i]) : idle;
      const bh = Math.max(3, level * h);
      ctx.beginPath();
      ctx.roundRect(i * 9, (h - bh) / 2, 5, bh, 2.5);
      ctx.fill();
    }
  };

  useCanvasScene(canvasRef, frame, { dur: 1000, stillAt: 1, playing: true });
  return <canvas ref={canvasRef} aria-hidden="true" className="h-12 w-full" />;
}
