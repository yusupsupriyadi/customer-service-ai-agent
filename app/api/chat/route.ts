import { findAgent } from "@/lib/agents";
import { buildSystemPrompt, MAX_CONTEXT_CHARS, type ChatMode } from "@/lib/prompt";
import { env, jsonError, rateLimited, rejectCrossSite } from "@/lib/server";

// Pilihan Reasoning. Menurut dokumentasi Netra, enabled: false mematikan tahap berpikir.
const REASONING = {
  off: { enabled: false },
  low: { enabled: true, effort: "low" },
  high: { enabled: true, effort: "high" },
} as const;

type Message = { role: "user" | "assistant"; content: string };

function describeNetraError(status: number, detail?: string) {
  if (status === 401 || status === 403) return "NETRA_API_KEY ditolak. Periksa key di .env.local.";
  if (status === 402) return "Saldo atau kuota Netra habis.";
  if (status === 429) return "Terlalu banyak permintaan ke Netra. Tunggu sebentar, lalu kirim lagi.";
  if (status >= 500) return "Server Netra sedang bermasalah. Coba lagi beberapa saat lagi.";
  return `Permintaan ke Netra gagal (kode ${status})${detail ? `: ${detail}` : "."}`;
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request) ?? rateLimited(request, "chat", 30);
  if (blocked) return blocked;
  if (!env.netraKey) return jsonError("NETRA_API_KEY belum diisi di .env.local.", 500);

  const body = await request.json().catch(() => null);
  const mode: ChatMode = body?.mode === "call" ? "call" : "chat";
  const reasoning = REASONING[body?.reasoning as keyof typeof REASONING] ?? REASONING.high;
  const context = typeof body?.context === "string" ? body.context.slice(0, MAX_CONTEXT_CHARS) : "";
  const messages: Message[] = Array.isArray(body?.messages)
    ? body.messages
        .filter((m: Message) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
        .slice(-40)
        .map((m: Message) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];
  if (messages.length === 0) return jsonError("Pertanyaan kosong.", 400);

  let response: Response;
  try {
    response = await fetch(env.netraUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.netraKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.netraModel,
        messages: [{ role: "system", content: buildSystemPrompt(findAgent(body?.agentId), context, mode) }, ...messages],
        // Token penalaran ikut dihitung di max_tokens, jadi batasnya dibuat cukup longgar.
        max_tokens: 2048,
        reasoning,
      }),
    });
  } catch {
    return jsonError("Server tidak bisa terhubung ke Netra. Periksa koneksi internet.", 502);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) return jsonError(describeNetraError(response.status, data?.error?.message), response.status === 429 ? 429 : 502);

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) return jsonError("Model tidak mengirim jawaban. Coba kirim ulang pertanyaannya.", 502);
  return Response.json({ reply });
}
