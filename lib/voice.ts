"use client";

import type { Message } from "@/lib/client";
import { requestSpeech } from "@/lib/client";

export type VoiceStatus = "idle" | "connecting" | "recording" | "transcribing";
export type CallStatus = "off" | "connecting" | "listening" | "thinking" | "speaking";

export const MAX_RECORDING_SECONDS = 60;

function describeMicError(error: unknown) {
  const name = (error as DOMException)?.name;
  if (name === "NotAllowedError") return "Izin mikrofon ditolak. Klik ikon di kiri alamat web, izinkan Mikrofon, lalu coba lagi.";
  if (name === "NotFoundError") return "Mikrofon tidak ditemukan. Pasang mikrofon atau headset, lalu coba lagi.";
  if (name === "NotReadableError") return "Mikrofon sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu coba lagi.";
  return "Mikrofon tidak bisa dipakai. Muat ulang halaman, lalu coba lagi.";
}

export async function getMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error("Browser ini tidak bisa merekam suara. Pakai Chrome atau Edge versi terbaru.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new Error(describeMicError(error));
  }
}

// Server membuat token sementara, lalu browser membuka WebSocket ke Deepgram dengan token itu.
// Browser tidak bisa menambah header Authorization ke WebSocket, jadi token dikirim lewat subprotocol.
export async function openListenSocket(): Promise<WebSocket> {
  let response: Response;
  try {
    response = await fetch("/api/listen-token", { method: "POST" });
  } catch {
    throw new Error("Tidak bisa terhubung ke server aplikasi.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Token Deepgram gagal dibuat.");
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(data.url, ["bearer", data.token]);
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error("Gagal tersambung ke Deepgram. Periksa koneksi internet.")));
  });
}

type Transcript = { finalText: string; interimText: string };

// Hasil sementara (is_final false) masih bisa berubah, jadi hanya hasil final yang disimpan.
function collectTranscript(target: Transcript, data: { is_final: boolean; channel: { alternatives: { transcript: string }[] } }) {
  const text = data.channel.alternatives[0]?.transcript ?? "";
  if (data.is_final) {
    if (text) target.finalText = `${target.finalText} ${text}`.trim();
    target.interimText = "";
  } else {
    target.interimText = text;
  }
  return `${target.finalText} ${target.interimText}`.trim();
}

/* Dikte: suara pelanggan muncul sebagai teks di kolom pertanyaan */

export class Dictation {
  private socket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private timer = 0;
  private stopping = false;
  private transcript: Transcript = { finalText: "", interimText: "" };

  constructor(
    private hooks: {
      onText: (heard: string) => void;
      onDone: (result: { heard: string; error?: string; send: boolean }) => void;
    },
  ) {}

  async start() {
    // Token dan WebSocket dulu, supaya key yang belum diisi langsung ketahuan sebelum izin mikrofon.
    const socket = await openListenSocket();
    let stream: MediaStream;
    try {
      stream = await getMicrophone();
    } catch (error) {
      socket.close();
      throw error;
    }
    const recorder = new MediaRecorder(stream);
    Object.assign(this, { socket, stream, recorder, stopping: false, transcript: { finalText: "", interimText: "" } });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "Results") this.hooks.onText(collectTranscript(this.transcript, data));
    });
    socket.addEventListener("close", () => this.finish());
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
    });
    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      // CloseStream: Deepgram mengirim sisa teks yang belum final, lalu menutup koneksi.
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "CloseStream" }));
      window.setTimeout(() => socket.close(), 5000);
    });
    recorder.start(250);
    this.timer = window.setTimeout(() => this.stop(), MAX_RECORDING_SECONDS * 1000);
  }

  stop() {
    if (!this.recorder || this.recorder.state === "inactive") return;
    window.clearTimeout(this.timer);
    this.stopping = true;
    this.recorder.stop();
  }

  private finish() {
    window.clearTimeout(this.timer);
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    const { finalText, interimText } = this.transcript;
    // Kalau koneksi putus tiba-tiba, teks sementara ikut disimpan supaya tidak hilang.
    const heard = this.stopping ? finalText : `${finalText} ${interimText}`.trim();
    if (!this.stopping) {
      this.hooks.onDone({
        heard,
        send: false,
        error: heard
          ? "Sambungan ke Deepgram terputus. Teks yang sudah terdengar ada di kolom pertanyaan."
          : "Sambungan ke Deepgram terputus. Periksa koneksi internet, lalu coba lagi.",
      });
    } else if (!finalText) {
      this.hooks.onDone({ heard, send: false, error: "Suara tidak terdengar jelas. Dekatkan mikrofon, lalu coba lagi." });
    } else {
      this.hooks.onDone({ heard, send: true });
    }
  }
}

/* Telepon: dengar, jawab, bacakan, lalu dengar lagi */

const CAN_STREAM_MP3 = typeof window !== "undefined" && (window.MediaSource?.isTypeSupported("audio/mpeg") ?? false);

// Suara diputar sambil potongan berikutnya masih diunduh, jadi agent mulai bicara lebih cepat.
function streamAudio(response: Response) {
  const mediaSource = new MediaSource();
  const audio = new Audio(URL.createObjectURL(mediaSource));
  mediaSource.addEventListener(
    "sourceopen",
    async () => {
      const buffer = mediaSource.addSourceBuffer("audio/mpeg");
      const reader = response.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer.appendBuffer(value);
          await new Promise((resolve) => buffer.addEventListener("updateend", resolve, { once: true }));
        }
        mediaSource.endOfStream();
      } catch {
        if (mediaSource.readyState === "open") mediaSource.endOfStream("network");
      }
    },
    { once: true },
  );
  return audio;
}

export async function createAgentAudio(response: Response) {
  if (CAN_STREAM_MP3) return streamAudio(response);
  return new Audio(URL.createObjectURL(await response.blob()));
}

// Promise selesai saat suara habis diputar, atau saat dihentikan.
export function playAudio(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      URL.revokeObjectURL(audio.src);
      resolve();
    };
    audio.addEventListener("ended", finish);
    audio.addEventListener("pause", finish);
    audio.addEventListener("error", () => reject(new Error("Suara agent tidak bisa diputar.")));
    audio.play().catch(() => reject(new Error("Browser menahan suara agent. Klik halaman ini, lalu coba lagi.")));
  });
}

// Kalimat jeda: agent bilang sedang mengecek, bukan diam saja selagi menunggu jawaban.
const CHECKING_LINES = [
  "Oke Kak, sebentar ya, saya cek dulu.",
  "Baik Kak, saya cek terlebih dahulu ya.",
  "Hmm, sebentar ya Kak, saya lihat datanya dulu.",
];
const STILL_CHECKING_LINE = "Masih saya cek ya Kak, mohon ditunggu sebentar.";
const THANKS_FOR_WAITING_LINES = ["Makasih sudah menunggu ya Kak.", "Oke Kak, sudah saya cek ya."];
const CHECKING_DELAY_MS = 1000;
const STILL_CHECKING_DELAY_MS = 6000;
// Basa-basi pendek seperti "oke makasih" tidak perlu dicek dulu.
const SMALL_TALK = /^(halo|hai|oke|ok|baik|siap|sip|iya|ya|makasih|terima kasih)\b/i;

const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

function settlesWithin(promise: Promise<unknown>, ms: number) {
  const settled = promise.then(() => true, () => true);
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms));
  return Promise.race([settled, timeout]);
}

export function buildGreeting(agentName: string) {
  const hour = new Date().getHours();
  const time = hour < 11 ? "pagi" : hour < 15 ? "siang" : hour < 18 ? "sore" : "malam";
  return `Halo, selamat ${time}! Dengan ${agentName} dari customer service. Ada yang bisa saya bantu, Kak?`;
}

type CallHooks = {
  agentId: string;
  agentName: string;
  getHistory: () => Message[];
  setHistory: (messages: Message[]) => void;
  ask: (messages: Message[]) => Promise<string>;
  onStatus: (status: CallStatus) => void;
  onTranscript: (text: string) => void;
  onEnd: (error: string) => void;
};

export class CallSession {
  status: CallStatus = "off";
  startedAt = 0;
  private socket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private audio: HTMLAudioElement | null = null;
  private keepAlive = 0;
  private transcript: Transcript = { finalText: "", interimText: "" };
  private turnEnded = false;
  private lineAudio: Record<string, Promise<Blob>> = {};
  private audioContext: AudioContext | null = null;
  micAnalyser: AnalyserNode | null = null;
  speakAnalyser: AnalyserNode | null = null;

  constructor(private hooks: CallHooks) {}

  private setStatus(status: CallStatus) {
    this.status = status;
    if (status !== "listening") this.hooks.onTranscript("");
    this.hooks.onStatus(status);
  }

  private push(message: Message) {
    this.hooks.setHistory([...this.hooks.getHistory(), message]);
  }

  async start() {
    this.setStatus("connecting");
    // Dibuat di dalam klik tombol, jadi browser mengizinkan audio langsung berjalan.
    this.audioContext = new AudioContext();
    let stream: MediaStream | null = null;
    let socket: WebSocket | null = null;
    try {
      socket = await openListenSocket();
      stream = await getMicrophone();
    } catch (error) {
      socket?.close();
      this.end((error as Error).message);
      return;
    }
    // Pelanggan bisa menekan Akhiri panggilan saat masih menyambungkan.
    if (this.status === "off") {
      stream.getTracks().forEach((track) => track.stop());
      socket.close();
      return;
    }
    this.stream = stream;
    this.socket = socket;
    this.micAnalyser = this.audioContext.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.audioContext.createMediaStreamSource(stream).connect(this.micAnalyser);

    socket.addEventListener("message", (event) => this.handleMessage(event));
    socket.addEventListener("close", () => this.end("Panggilan terputus. Periksa koneksi internet, lalu telepon lagi."));
    this.recorder = new MediaRecorder(stream);
    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) this.socket.send(event.data);
    });
    this.recorder.start(250);
    // Deepgram menutup koneksi yang 10 detik tidak menerima apa pun, misalnya saat rekaman dijeda.
    this.keepAlive = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: "KeepAlive" }));
    }, 5000);
    this.startedAt = Date.now();

    this.preloadLines();
    this.pauseListening();
    const greeting = buildGreeting(this.hooks.agentName);
    this.push({ role: "assistant", content: greeting });
    await this.agentSays(greeting);
  }

  end(errorMessage = "") {
    if (this.status === "off") return;
    window.clearInterval(this.keepAlive);
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: "CloseStream" }));
    this.socket?.close();
    this.audio?.pause();
    this.audioContext?.close().catch(() => {});
    Object.assign(this, { socket: null, stream: null, recorder: null, audio: null, micAnalyser: null, speakAnalyser: null });
    this.setStatus("off");
    this.hooks.onEnd(errorMessage);
  }

  // Selama agent berpikir dan bicara, rekaman dijeda supaya suara agent tidak terdengar sebagai suara pelanggan.
  private pauseListening() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  private resumeListening() {
    this.transcript = { finalText: "", interimText: "" };
    this.turnEnded = false;
    if (this.recorder?.state === "paused") this.recorder.resume();
    this.setStatus("listening");
  }

  private getLineAudio(text: string) {
    this.lineAudio[text] ??= requestSpeech(this.hooks.agentId, text)
      .then((response) => response.blob())
      .catch((error) => {
        delete this.lineAudio[text];
        throw error;
      });
    return this.lineAudio[text];
  }

  private async preloadLines() {
    for (const line of [...CHECKING_LINES, STILL_CHECKING_LINE]) {
      await this.getLineAudio(line).catch(() => {});
    }
  }

  private connectSpeaker(audio: HTMLAudioElement) {
    const context = this.audioContext;
    if (!context || context.state !== "running") return;
    try {
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      this.speakAnalyser = analyser;
    } catch {
      this.speakAnalyser = null;
    }
  }

  private async speak(text: string, fromCache = false) {
    const audio = fromCache
      ? new Audio(URL.createObjectURL(await this.getLineAudio(text)))
      : await createAgentAudio(await requestSpeech(this.hooks.agentId, text));
    if (this.status === "off") return;
    this.connectSpeaker(audio);
    this.audio = audio;
    this.setStatus("speaking");
    await playAudio(audio);
  }

  private async agentSays(text: string) {
    try {
      await this.speak(text);
    } catch (error) {
      this.end((error as Error).message);
      return;
    }
    if (this.status !== "off") this.resumeListening();
  }

  private async sayWhileChecking(line: string) {
    this.push({ role: "assistant", content: line });
    try {
      await this.speak(line, true);
    } catch {
      // Kalimat jeda boleh gagal diputar. Jawaban utamanya tetap dibacakan.
    }
    if (this.status !== "off") this.setStatus("thinking");
  }

  private async answer(question: string) {
    this.pauseListening();
    const before = this.hooks.getHistory();
    this.push({ role: "user", content: question });
    this.setStatus("thinking");
    const replyPromise = this.hooks.ask(this.hooks.getHistory());

    // Seperti CS sungguhan: kalau jawabannya belum siap, agent bilang sedang mengecek.
    let waited = false;
    const needsChecking = !(question.split(/\s+/).length <= 4 && SMALL_TALK.test(question));
    if (needsChecking && !(await settlesWithin(replyPromise, CHECKING_DELAY_MS))) {
      waited = true;
      await this.sayWhileChecking(pickRandom(CHECKING_LINES));
      if (this.status !== "off" && !(await settlesWithin(replyPromise, STILL_CHECKING_DELAY_MS))) {
        await this.sayWhileChecking(STILL_CHECKING_LINE);
      }
    }

    let reply: string;
    try {
      reply = await replyPromise;
    } catch (error) {
      // Pertanyaan dan kalimat jeda yang gagal dijawab dibuang.
      this.hooks.setHistory(before);
      this.end((error as Error).message);
      return;
    }
    if (waited) reply = `${pickRandom(THANKS_FOR_WAITING_LINES)} ${reply}`;
    this.push({ role: "assistant", content: reply });
    if (this.status !== "off") await this.agentSays(reply);
  }

  private handleMessage(event: MessageEvent) {
    // Selama agent berpikir atau bicara, hasil dari Deepgram diabaikan.
    if (this.status !== "listening") return;
    const data = JSON.parse(event.data);
    if (data.type === "Results") this.hooks.onTranscript(collectTranscript(this.transcript, data));
    // UtteranceEnd: pelanggan sudah diam 1 detik setelah kata terakhir.
    if (data.type === "UtteranceEnd" && (this.transcript.finalText || this.transcript.interimText)) this.turnEnded = true;
    // UtteranceEnd kadang datang sebelum hasil final kalimat terakhir, jadi tunggu sampai tidak ada teks sementara.
    if (this.turnEnded && !this.transcript.interimText && this.transcript.finalText) {
      void this.answer(this.transcript.finalText);
    }
  }
}
