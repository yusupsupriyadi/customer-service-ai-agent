"use client";

import { useRef, useState } from "react";
import { E, nz, seg, useCanvasScene, usePrefersReducedMotion, type Frame } from "@/lib/motion";

// Adegan pembuka di kanvas: pertanyaan pelanggan bermata berdatangan, lalu agent menjawab satu per satu.
// Isi percakapan adalah contoh untuk toko sepatu fiktif, dan diberi label "Contoh panggilan".
const STAGE = { w: 560, h: 600 };
const DUR = 12;
const INK = "#100f0d";
const YELLOW = "#ffd400";
const WHITE = "#ffffff";

const QUESTIONS = [
  { text: "jam buka kapan kak?", x: 30, y: 70, rot: -6, pop: 0.1, answer: "Buka tiap hari, jam delapan pagi sampai lima sore, Kak." },
  { text: "ongkir ke Bogor berapa?", x: 290, y: 30, rot: 5, pop: 0.45, answer: "Ongkir ke Bogor lima belas ribu, Kak." },
  { text: "bisa COD nggak?", x: 10, y: 300, rot: 4, pop: 0.8, answer: "Bisa COD untuk area Jabodetabek, Kak." },
  { text: "ukuran 42 ada?", x: 360, y: 260, rot: -5, pop: 1.15, answer: "Ukuran 42 masih ada, Kak. Mau sekalian dipesan?" },
  { text: "bisa retur kak?", x: 40, y: 500, rot: -3, pop: 1.5, answer: "Bisa, paling lambat tujuh hari setelah barang sampai." },
];
const ANSWER_AT = (i: number) => 2.6 + i * 1.75;
const OUT_AT = 11.3;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const frame: Frame = (ctx, t, { w, h, font }) => {
  const scale = Math.min(w / STAGE.w, h / STAGE.h);
  ctx.save();
  ctx.translate((w - STAGE.w * scale) / 2, (h - STAGE.h * scale) / 2);
  ctx.scale(scale, scale);
  const out = E.in(seg(t, OUT_AT, DUR));

  // Latar hitam bertitik kuning, sedikit bergeser (paralaks).
  roundRect(ctx, 40, 40, 480, 540, 36);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(255,212,0,0.28)";
  const shift = nz(t * 0.4, 2) * 6;
  for (let gy = 40; gy < 590; gy += 16) for (let gx = 40; gx < 530; gx += 16) ctx.fillRect(gx + shift, gy, 2.6, 2.6);
  ctx.restore();

  // Ponsel agent di tengah, bergoyang halus.
  const px = 150 + nz(t, 1) * 3;
  const py = 92 + nz(t, 4) * 4;
  ctx.fillStyle = YELLOW;
  roundRect(ctx, px + 10, py + 10, 260, 450, 30);
  ctx.fill();
  roundRect(ctx, px, py, 260, 450, 30);
  ctx.fillStyle = WHITE;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `700 13px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText("Contoh panggilan", px + 130, py + 430);
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.arc(px + 44, py + 78, 22, 0, Math.PI * 2);
  ctx.fillStyle = YELLOW;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `800 20px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText("F", px + 44, py + 85);
  ctx.textAlign = "left";
  ctx.font = `800 22px ${font}`;
  ctx.fillText("Fitri", px + 78, py + 75);
  const seconds = Math.floor(t + 7);
  ctx.font = `600 14px ${font}`;
  ctx.fillText(`00:${String(seconds).padStart(2, "0")}`, px + 78, py + 96);

  // Pertanyaan yang sedang dijawab menentukan isi layar ponsel.
  let active = -1;
  QUESTIONS.forEach((_, i) => {
    if (t >= ANSWER_AT(i)) active = i;
  });
  const talking = active >= 0 && t < ANSWER_AT(active) + 1.5;

  // Gelombang suara: tinggi saat agent menjawab, rendah saat mendengarkan.
  const amp = talking ? 1 : 0.35;
  for (let b = 0; b < 22; b++) {
    const bh = 6 + Math.abs(nz(t * 3.2 + b * 0.37, b)) * 46 * amp * (1 - out);
    ctx.fillStyle = INK;
    roundRect(ctx, px + 24 + b * 10, py + 160 - bh / 2, 6, bh, 3);
    ctx.fill();
  }
  const pill = talking ? "Agent menjawab" : "Agent mendengarkan";
  ctx.font = `800 13px ${font}`;
  const pw = ctx.measureText(pill).width + 24;
  roundRect(ctx, px + 130 - pw / 2, py + 206, pw, 28, 14);
  ctx.fillStyle = talking ? YELLOW : INK;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = talking ? INK : WHITE;
  ctx.textAlign = "center";
  ctx.fillText(pill, px + 130, py + 225);
  ctx.textAlign = "left";

  if (active >= 0) {
    const typed = E.out(seg(t, ANSWER_AT(active) + 0.15, ANSWER_AT(active) + 1.3));
    const full = QUESTIONS[active].answer;
    const text = full.slice(0, Math.round(full.length * typed));
    ctx.font = `700 16px ${font}`;
    const lines = wrap(ctx, full, 196);
    const boxH = lines.length * 22 + 26;
    const pop = E.back(seg(t, ANSWER_AT(active), ANSWER_AT(active) + 0.35));
    ctx.save();
    ctx.translate(px + 130, py + 262 + boxH / 2);
    ctx.scale(pop * (1 - out), pop * (1 - out));
    ctx.rotate(-0.02);
    roundRect(ctx, -113 + 5, -boxH / 2 + 5, 226, boxH, 14);
    ctx.fillStyle = INK;
    ctx.fill();
    roundRect(ctx, -113, -boxH / 2, 226, boxH, 14);
    ctx.fillStyle = YELLOW;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = INK;
    wrap(ctx, text, 196).forEach((line, li) => ctx.fillText(line, -98, -boxH / 2 + 30 + li * 22));
    ctx.restore();
  }

  // Gelembung pertanyaan bermata: masuk memantul, lalu dicap "dijawab".
  QUESTIONS.forEach((q, i) => {
    const k = seg(t, q.pop, q.pop + 0.5);
    if (k <= 0) return;
    const s = E.back(k) * (1 - out);
    if (s <= 0.01) return;
    const squash = 1 + 0.18 * Math.sin(k * Math.PI) * (1 - k);
    ctx.font = `800 17px ${font}`;
    const bw = ctx.measureText(q.text).width + 32;
    const bh = 62;
    const bob = nz(t * 0.8, i + 7) * 5;
    ctx.save();
    ctx.translate(q.x + bw / 2, q.y + bh / 2 + bob);
    ctx.rotate((q.rot * Math.PI) / 180);
    ctx.scale(s * squash, s / squash);
    ctx.translate(-bw / 2, -bh / 2);
    const answered = t >= ANSWER_AT(i);
    ctx.fillStyle = INK;
    roundRect(ctx, 5, 5, bw, bh, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, bh - 2);
    ctx.lineTo(14, bh + 16);
    ctx.lineTo(40, bh - 2);
    ctx.closePath();
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    roundRect(ctx, 0, 0, bw, bh, 16);
    ctx.fill();
    ctx.stroke();
    // Mata berkedip di waktu yang tetap untuk tiap gelembung.
    const blink = (t + i * 1.3) % 3.1 < 0.12 ? 0.15 : 1;
    ctx.fillStyle = INK;
    for (const ex of [-7, 7]) {
      ctx.beginPath();
      ctx.ellipse(bw / 2 + ex, 17, 3.4, 4.2 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.fillText(q.text, bw / 2, 46);
    ctx.textAlign = "left";
    if (answered) {
      const stamp = E.back(seg(t, ANSWER_AT(i), ANSWER_AT(i) + 0.3));
      ctx.save();
      ctx.translate(bw - 6, -4);
      ctx.rotate(0.18);
      ctx.scale(stamp, stamp);
      ctx.font = `800 12px ${font}`;
      const label = "✓ dijawab";
      const lw = ctx.measureText(label).width + 16;
      roundRect(ctx, -lw / 2, -12, lw, 24, 8);
      ctx.fillStyle = YELLOW;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.fillText(label, 0, 5);
      ctx.restore();
    }
    ctx.restore();
  });

  ctx.restore();
};

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const reduce = usePrefersReducedMotion();
  useCanvasScene(canvasRef, frame, { dur: DUR, stillAt: 7.4, playing });

  return (
    <div id="hero-scene" className="relative w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Animasi contoh: pertanyaan pelanggan seperti jam buka, ongkir, dan COD dijawab satu per satu oleh agent bernama Fitri."
        className="aspect-[56/60] w-full font-sans"
      />
      {!reduce && (
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-pressed={!playing}
          className="btn absolute right-2 bottom-2 min-h-11 px-3 text-xs"
        >
          {playing ? "Jeda animasi" : "Putar animasi"}
        </button>
      )}
    </div>
  );
}
