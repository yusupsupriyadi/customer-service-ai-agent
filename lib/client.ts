"use client";

export type Message = { role: "user" | "assistant"; content: string };
export type Reasoning = "off" | "low" | "high";

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return new Error(data?.error || fallback);
}

// Pertanyaan dikirim ke route /api/chat di server kita. Key Netra hanya ada di server.
export async function askAgent(input: {
  agentId: string;
  mode: "chat" | "call";
  reasoning: Reasoning;
  context: string;
  messages: Message[];
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server aplikasi. Pastikan npm run dev masih berjalan.");
  }
  if (!response.ok) throw await readError(response, `Permintaan gagal (kode ${response.status}).`);
  const data = await response.json();
  return data.reply as string;
}

export async function requestSpeech(agentId: string, text: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, text }),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server aplikasi.");
  }
  if (!response.ok) throw await readError(response, "Suara agent gagal dibuat.");
  return response;
}

// localStorage bisa melempar error (misalnya mode privat), jadi selalu dibungkus try/catch.
export function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Aplikasi tetap jalan, hanya tidak tersimpan.
  }
}

export function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

// pdf.js baru dimuat saat pertama kali ada PDF, jadi halaman awal tetap ringan.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfJs() {
  pdfjsPromise ??= import("pdfjs-dist")
    .then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      return pdfjs;
    })
    .catch((error) => {
      pdfjsPromise = null;
      throw error;
    });
  return pdfjsPromise;
}

export async function extractPdfText(file: File) {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    // hasEOL menandai akhir baris di PDF, jadi baris asli tetap terjaga.
    const text = content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "")).join("");
    pageTexts.push(text.trim());
  }
  const pages = pdf.numPages;
  await task.destroy();
  return { pages, text: pageTexts.join("\n\n").replace(/[ \t]+/g, " ").trim() };
}
