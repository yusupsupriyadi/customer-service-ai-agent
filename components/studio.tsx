"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AGENTS, DEFAULT_AGENT_ID, findAgent } from "@/lib/agents";
import { askAgent, extractPdfText, formatNumber, readStorage, requestSpeech, writeStorage, type Message, type Reasoning } from "@/lib/client";
import { MAX_CONTEXT_CHARS } from "@/lib/prompt";
import { CallSession, Dictation, MAX_RECORDING_SECONDS, playAudio, type CallStatus, type VoiceStatus } from "@/lib/voice";
import { VoiceMeter } from "@/components/voice-meter";

const STORAGE = { agent: "csagent.agent", reasoning: "csagent.reasoning", contextText: "csagent.contextText" };
const TILTS = ["-1.5deg", "1.2deg", "-0.8deg", "1.6deg", "-1.2deg"];

type Doc = { name: string; pages: number; text: string };
type KeyStatus = { netra: boolean; deepgram: boolean } | "loading" | "error";

const CALL_LABELS: Record<CallStatus, string> = {
  off: "",
  connecting: "Menyambungkan...",
  listening: "Silakan bicara. Agent mendengarkan.",
  thinking: "Agent sedang mengecek...",
  speaking: "Agent sedang bicara...",
};
const MIC_LABELS: Record<VoiceStatus, string> = {
  idle: "Rekam suara",
  connecting: "Menyambungkan mikrofon",
  recording: "Berhenti merekam dan kirim",
  transcribing: "Menunggu teks terakhir",
};
const VOICE_MESSAGES: Record<VoiceStatus, string> = {
  idle: "",
  connecting: "Menyambungkan ke Deepgram...",
  recording: `Merekam. Teks muncul di kolom pertanyaan selagi kamu bicara. Tekan tombol mic lagi untuk mengirim, paling lama ${MAX_RECORDING_SECONDS} detik.`,
  transcribing: "Menunggu teks terakhir dari Deepgram...",
};

function Initial({ name, size = "h-11 w-11 text-lg" }: { name: string; size?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-yellow font-extrabold ${size}`}>
      {name[0]}
    </span>
  );
}

export function Studio() {
  const [agentId, setAgentId] = useState(DEFAULT_AGENT_ID);
  const [reasoning, setReasoning] = useState<Reasoning>("high");
  const [contextText, setContextText] = useState("");
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [pdfStatus, setPdfStatus] = useState<{ text: string; tone: "info" | "ok" | "error" } | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [history, setHistoryState] = useState<Message[]>([]);
  const historyRef = useRef<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [callStatus, setCallStatus] = useState<CallStatus>("off");
  const [callTranscript, setCallTranscript] = useState("");
  const [clock, setClock] = useState("00:00");
  const [keyStatus, setKeyStatus] = useState<KeyStatus>("loading");
  const [preview, setPreview] = useState<{ id: string; state: "loading" | "playing" } | null>(null);
  const [previewError, setPreviewError] = useState<{ id: string; text: string } | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const dictationRef = useRef<Dictation | null>(null);
  const typedRef = useRef("");
  const callRef = useRef<CallSession | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
  const endCallRef = useRef<HTMLButtonElement>(null);

  const agent = findAgent(agentId);

  const setHistory = useCallback((next: Message[]) => {
    historyRef.current = next;
    setHistoryState(next);
  }, []);

  // Data tersimpan dipulihkan setelah halaman terpasang di browser.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedAgent = readStorage(STORAGE.agent);
    if (savedAgent && AGENTS.some((a) => a.id === savedAgent)) setAgentId(savedAgent);
    const savedReasoning = readStorage(STORAGE.reasoning);
    if (savedReasoning === "off" || savedReasoning === "low" || savedReasoning === "high") setReasoning(savedReasoning);
    setContextText(readStorage(STORAGE.contextText) ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/status")
      .then((response) => response.json())
      .then((data) => setKeyStatus({ netra: Boolean(data.netra), deepgram: Boolean(data.deepgram) }))
      .catch(() => setKeyStatus("error"));
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [history, isSending, voiceStatus, error]);

  useEffect(() => {
    if (callStatus === "off") return;
    const timer = window.setInterval(() => {
      const started = callRef.current?.startedAt;
      if (!started) return;
      const seconds = Math.floor((Date.now() - started) / 1000);
      setClock(`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`);
    }, 500);
    return () => window.clearInterval(timer);
  }, [callStatus]);

  useEffect(() => () => {
    callRef.current?.end();
    previewAudioRef.current?.pause();
  }, []);

  const buildContext = () => {
    const parts: string[] = [];
    if (contextText.trim()) parts.push(`[Catatan teks]\n${contextText.trim()}`);
    for (const doc of documents) parts.push(`[Dokumen: ${doc.name}]\n${doc.text}`);
    return parts.join("\n\n");
  };
  const contextLength = buildContext().length;

  const chooseAgent = (id: string) => {
    setAgentId(id);
    writeStorage(STORAGE.agent, id);
  };

  const stopPreview = () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPreview(null);
  };

  const playPreview = async (id: string) => {
    if (preview?.id === id) {
      stopPreview();
      return;
    }
    stopPreview();
    setPreviewError(null);
    setPreview({ id, state: "loading" });
    try {
      const response = await requestSpeech(id, findAgent(id).sample);
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      previewAudioRef.current = audio;
      setPreview({ id, state: "playing" });
      await playAudio(audio);
    } catch (err) {
      setPreviewError({ id, text: (err as Error).message });
    }
    setPreview((current) => (current?.id === id ? null : current));
  };

  const handlePdfFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    setPdfBusy(true);
    setPdfStatus({ text: `Membaca ${files.length} PDF...`, tone: "info" });
    const failed: string[] = [];
    const added: Doc[] = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        failed.push(`${file.name} (bukan PDF)`);
        continue;
      }
      try {
        const result = await extractPdfText(file);
        if (!result.text) failed.push(`${file.name} (tidak ada teks, mungkin hasil scan)`);
        else added.push({ name: file.name, ...result });
      } catch (err) {
        console.error(err);
        failed.push(`${file.name} (rusak atau terkunci password)`);
      }
    }
    setDocuments((docs) => [...docs, ...added]);
    setPdfBusy(false);
    if (failed.length > 0) {
      const prefix = added.length > 0 ? `${added.length} PDF berhasil dibaca. ` : "";
      setPdfStatus({ text: `${prefix}Tidak bisa dipakai: ${failed.join(", ")}.`, tone: "error" });
    } else {
      setPdfStatus({ text: `${added.length} PDF berhasil dibaca.`, tone: "ok" });
    }
  };

  const showError = (message: string) => {
    setError(message);
    setLiveMessage(message);
  };

  const sendQuestion = async (raw: string) => {
    const question = raw.trim();
    if (!question) {
      inputRef.current?.focus();
      return;
    }
    setError("");
    const before = historyRef.current;
    setHistory([...before, { role: "user", content: question }]);
    setInput("");
    setIsSending(true);
    setLiveMessage(`${agent.name} sedang menulis jawaban.`);
    try {
      const reply = await askAgent({ agentId, mode: "chat", reasoning, context: buildContext(), messages: historyRef.current });
      setHistory([...historyRef.current, { role: "assistant", content: reply }]);
      setLiveMessage(`${agent.name}: ${reply}`);
    } catch (err) {
      // Pertanyaan yang gagal dikembalikan ke kolom input supaya bisa langsung dikirim ulang.
      setHistory(before);
      setInput(question);
      showError((err as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const busy = isSending || voiceStatus !== "idle" || callStatus !== "off";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    void sendQuestion(input);
  };

  const handleMic = async () => {
    if (voiceStatus === "recording") {
      setVoiceStatus("transcribing");
      dictationRef.current?.stop();
      return;
    }
    setError("");
    setVoiceStatus("connecting");
    typedRef.current = input.trim();
    const dictation = new Dictation({
      onText: (heard) => setInput(`${typedRef.current} ${heard}`.trim()),
      onDone: ({ heard, send, error: message }) => {
        const text = `${typedRef.current} ${heard}`.trim();
        setInput(text);
        setVoiceStatus("idle");
        micRef.current?.focus();
        if (message) showError(message);
        else if (send) void sendQuestion(text);
      },
    });
    dictationRef.current = dictation;
    try {
      await dictation.start();
      setVoiceStatus("recording");
      setLiveMessage("Merekam. Tekan tombol mic lagi untuk mengirim.");
    } catch (err) {
      setVoiceStatus("idle");
      showError((err as Error).message);
    }
  };

  const startCall = async () => {
    setError("");
    setClock("00:00");
    stopPreview();
    const session = new CallSession({
      agentId,
      agentName: agent.name,
      getHistory: () => historyRef.current,
      setHistory,
      ask: (messages) => askAgent({ agentId, mode: "call", reasoning, context: buildContext(), messages }),
      onStatus: setCallStatus,
      onTranscript: setCallTranscript,
      onEnd: (message) => {
        if (message) showError(message);
        else setLiveMessage("Panggilan selesai.");
        callButtonRef.current?.focus();
      },
    });
    callRef.current = session;
    window.setTimeout(() => endCallRef.current?.focus(), 0);
    await session.start();
  };

  const clearChat = () => {
    setHistory([]);
    setError("");
    setLiveMessage("Percakapan dihapus.");
    inputRef.current?.focus();
  };

  const inCall = callStatus !== "off";
  const isRecording = voiceStatus === "recording";
  const isIdle = !busy;

  return (
    <>
      <section id="agen" aria-labelledby="agen-title" className="scroll-mt-4 border-y-[3px] border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 id="agen-title" className="text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-5xl">
            Pilih siapa yang{" "}
            <span className="sticker-big mt-2 -rotate-1 sm:mt-0">angkat telepon.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Lima suara Bahasa Indonesia dari Deepgram Flux. Tiap agent punya gaya bicara sendiri di chat, dan suaranya
            dipakai saat telepon.
          </p>

          <div role="radiogroup" aria-labelledby="agen-title" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((item, index) => {
              const selected = item.id === agentId;
              const previewing = preview?.id === item.id;
              return (
                <div
                  key={item.id}
                  id={`agent-card-${item.id}`}
                  style={{ rotate: TILTS[index] }}
                  className={`card flex flex-col p-4 transition-colors ${selected ? "bg-yellow" : "bg-paper"}`}
                >
                  <div className="flex items-center gap-3">
                    <Initial name={item.name} size={`h-12 w-12 text-xl ${selected ? "bg-paper" : ""}`} />
                    <div className="min-w-0">
                      <p className="text-2xl leading-none font-extrabold tracking-tight">{item.name}</p>
                      <p className="mt-1 text-xs font-bold">{item.gender}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-bold">{item.style}</p>
                  <p className="mt-1 font-mono text-[11px] break-all text-muted">{item.voice}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => void playPreview(item.id)}
                      disabled={inCall || (preview?.state === "loading" && !previewing)}
                      aria-label={previewing ? `Hentikan contoh suara ${item.name}` : `Dengar contoh suara ${item.name}`}
                      className="btn w-full"
                    >
                      {previewing ? (preview.state === "loading" ? "Memuat suara..." : "Hentikan") : "Dengar suaranya"}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseAgent(item.id)}
                      disabled={inCall}
                      className={`btn w-full ${selected ? "btn-ink" : ""}`}
                    >
                      {selected ? `${item.name} dipilih` : `Pilih ${item.name}`}
                    </button>
                  </div>
                  {previewError?.id === item.id && (
                    <p role="alert" className="mt-3 text-xs font-bold text-danger">{previewError.text}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="studio" aria-labelledby="studio-title" className="dots scroll-mt-4 bg-yellow">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="studio-title" className="text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-5xl">
              <span className="sticker rotate-1 py-1">Studio</span> tes agent
            </h2>
            <KeyStatusBadge status={keyStatus} />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <section id="knowledge-panel" aria-labelledby="knowledge-title" className="card self-start">
              <div className="border-b-[3px] border-ink px-5 py-3">
                <h3 id="knowledge-title" className="text-xl font-extrabold">Pengetahuan agent</h3>
              </div>
              <div className="space-y-6 p-5">
                <div>
                  <label htmlFor="context-text" className="field-label">Info usaha</label>
                  <p id="context-text-hint" className="hint mt-1">Produk, harga, jam buka, ongkir, aturan retur, dan sebagainya.</p>
                  <textarea
                    id="context-text"
                    rows={8}
                    value={contextText}
                    onChange={(event) => {
                      setContextText(event.target.value);
                      writeStorage(STORAGE.contextText, event.target.value);
                    }}
                    aria-describedby="context-text-hint"
                    placeholder="Contoh: Toko kami buka setiap hari pukul 08.00 sampai 17.00."
                    className="field mt-2 p-3"
                  />
                </div>

                <div>
                  <label htmlFor="pdf-input" className="field-label">Dokumen PDF</label>
                  <p id="pdf-hint" className="hint mt-1">Teks PDF dibaca di browser lalu ikut dikirim sebagai konteks. PDF hasil scan (gambar) tidak bisa dibaca.</p>
                  <input
                    id="pdf-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    disabled={pdfBusy}
                    aria-describedby="pdf-hint"
                    onChange={(event) => {
                      void handlePdfFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-[2.5px] file:border-ink file:bg-paper file:px-3 file:text-sm file:font-extrabold hover:file:bg-yellow-soft"
                  />
                  <p role="status" aria-live="polite" className={`mt-2 text-sm ${pdfStatus?.tone === "error" ? "font-bold text-danger" : pdfStatus?.tone === "ok" ? "font-bold" : ""}`}>
                    {pdfStatus?.text}
                  </p>
                  {documents.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {documents.map((doc, index) => (
                        <li key={`${doc.name}-${index}`} className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink p-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold" title={doc.name}>{doc.name}</p>
                            <p className="text-xs text-muted">{doc.pages} halaman, {formatNumber(doc.text.length)} karakter</p>
                          </div>
                          <button
                            type="button"
                            className="btn px-3"
                            aria-label={`Hapus dokumen ${doc.name}`}
                            onClick={() => {
                              setDocuments((docs) => docs.filter((_, i) => i !== index));
                              setPdfStatus({ text: `${doc.name} dihapus dari konteks.`, tone: "info" });
                            }}
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label htmlFor="reasoning" className="field-label">Reasoning</label>
                  <p id="reasoning-hint" className="hint mt-1">Seberapa lama model berpikir. Untuk telepon, pilih Mati atau Rendah supaya agent cepat menjawab.</p>
                  <select
                    id="reasoning"
                    value={reasoning}
                    aria-describedby="reasoning-hint"
                    onChange={(event) => {
                      setReasoning(event.target.value as Reasoning);
                      writeStorage(STORAGE.reasoning, event.target.value);
                    }}
                    className="field mt-2"
                  >
                    <option value="off">Mati: paling cepat</option>
                    <option value="low">Rendah</option>
                    <option value="high">Tinggi: paling teliti</option>
                  </select>
                </div>

                <p className={`rounded-xl border-2 border-ink p-3 text-sm ${contextLength > MAX_CONTEXT_CHARS ? "bg-yellow font-bold" : "bg-cream"}`}>
                  {contextLength === 0
                    ? "Belum ada konteks. Agent akan menjawab bahwa ia belum punya informasi usahamu."
                    : contextLength > MAX_CONTEXT_CHARS
                      ? `Konteks ${formatNumber(contextLength)} karakter, melebihi batas ${formatNumber(MAX_CONTEXT_CHARS)}. Bagian akhir akan dipotong.`
                      : `Konteks yang dikirim: ${formatNumber(contextLength)} dari ${formatNumber(MAX_CONTEXT_CHARS)} karakter.`}
                </p>
              </div>
            </section>

            <section id="chat-panel" aria-labelledby="chat-title" className="card flex h-[38rem] flex-col overflow-hidden lg:h-[44rem]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Initial name={agent.name} />
                  <div className="min-w-0">
                    <h3 id="chat-title" className="text-xl leading-tight font-extrabold">Chat dengan {agent.name}</h3>
                    <p className="text-xs font-bold text-muted">{agent.style}. <a href="#agen" className="underline decoration-2 underline-offset-2">Ganti agent</a></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button ref={callButtonRef} id="btn-call" type="button" onClick={() => void startCall()} disabled={busy} className="btn btn-yellow">
                    Telepon {agent.name}
                  </button>
                  <button id="btn-clear-chat" type="button" onClick={clearChat} disabled={history.length === 0 || !isIdle} className="btn">
                    Hapus percakapan
                  </button>
                </div>
              </div>

              <div ref={messagesRef} id="chat-messages" className="flex-1 space-y-4 overflow-y-auto bg-cream p-4">
                {history.length === 0 && isIdle && !error && (
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border-[2.5px] border-dashed border-ink bg-paper p-6 text-center text-sm">
                    <p className="text-lg font-extrabold">Belum ada percakapan</p>
                    <p className="mt-1">Isi info usaha di kiri, lalu ketik pertanyaan, tekan tombol mic, atau telepon {agent.name} seolah-olah kamu pelanggan.</p>
                  </div>
                )}
                {history.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl border-[2.5px] border-ink px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] ${isUser ? "rounded-br-sm bg-yellow" : "rounded-bl-sm bg-paper"}`}>
                        <p className="text-xs font-extrabold">{isUser ? "Pelanggan" : agent.name}</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
                {isSending && <p className="inline-block rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">{agent.name} sedang menulis jawaban...</p>}
                {voiceStatus !== "idle" && <p className="inline-block rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">{VOICE_MESSAGES[voiceStatus]}</p>}
                {error && <div role="alert" className="rounded-xl border-2 border-danger bg-paper p-3 text-sm font-bold text-danger">{error}</div>}
              </div>
              <p role="status" aria-live="polite" className="sr-only">{liveMessage}</p>

              {!inCall ? (
                <form id="chat-form" onSubmit={handleSubmit} aria-busy={isSending || voiceStatus === "transcribing"} className="border-t-[3px] border-ink p-3">
                  <label htmlFor="chat-input" className="field-label">Pertanyaan pelanggan</label>
                  <div className="mt-1 flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      id="chat-input"
                      rows={2}
                      value={input}
                      readOnly={voiceStatus !== "idle"}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        // isComposing dicek agar Enter saat mengetik dengan IME tidak langsung mengirim.
                        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      aria-describedby="chat-input-hint"
                      placeholder="Contoh: Jam berapa toko buka hari Minggu?"
                      className="field resize-none p-3"
                    />
                    <button
                      ref={micRef}
                      id="btn-mic"
                      type="button"
                      onClick={() => void handleMic()}
                      disabled={inCall || (voiceStatus !== "idle" && !isRecording)}
                      aria-label={MIC_LABELS[voiceStatus]}
                      title={MIC_LABELS[voiceStatus]}
                      className={`btn w-11 px-0 ${isRecording ? "btn-ink" : ""}`}
                    >
                      {isRecording ? (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" /></svg>
                      ) : (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="9" y="2.5" width="6" height="12" rx="3" />
                          <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22M8 22h8" />
                        </svg>
                      )}
                    </button>
                    <button id="btn-send" type="submit" disabled={busy} className="btn btn-yellow">
                      {isSending ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                  <p id="chat-input-hint" className="hint mt-1">Enter untuk kirim, Shift+Enter untuk baris baru. Tombol mic: teks muncul selagi kamu bicara.</p>
                </form>
              ) : (
                <div id="call-bar" className="on-dark border-t-[3px] border-ink bg-ink p-4 text-paper">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Initial name={agent.name} />
                      <div className="min-w-0">
                        <p role="status" aria-live="polite" className="text-lg font-extrabold">{CALL_LABELS[callStatus]}</p>
                        <p className="text-sm text-yellow-soft">
                          Telepon dengan {agent.name} <span className="tabular-nums"><span className="sr-only">, lama panggilan </span>{clock}</span>
                        </p>
                      </div>
                    </div>
                    <button ref={endCallRef} id="btn-end-call" type="button" onClick={() => callRef.current?.end()} className="btn btn-yellow">
                      Akhiri panggilan
                    </button>
                  </div>
                  <div className="mt-3">
                    <VoiceMeter
                      active={callStatus === "listening" || callStatus === "speaking"}
                      getAnalyser={() =>
                        callStatus === "speaking" ? callRef.current?.speakAnalyser ?? null : callStatus === "listening" ? callRef.current?.micAnalyser ?? null : null
                      }
                    />
                  </div>
                  <p className="mt-2 min-h-5 text-sm break-words text-yellow-soft">{callTranscript}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

function KeyStatusBadge({ status }: { status: KeyStatus }) {
  if (status === "loading") return <p className="sticker py-2 text-sm font-bold">Mengecek key di server...</p>;
  if (status === "error") return <p className="sticker py-2 text-sm font-bold text-danger">Server aplikasi tidak menjawab.</p>;
  const missing = [!status.netra && "NETRA_API_KEY", !status.deepgram && "DEEPGRAM_API_KEY"].filter(Boolean);
  return (
    <p id="key-status" className="sticker max-w-md py-2 text-sm font-bold">
      {missing.length === 0 ? "Key Netra dan Deepgram siap di server." : `Isi ${missing.join(" dan ")} di .env.local, lalu jalankan ulang npm run dev.`}
    </p>
  );
}
