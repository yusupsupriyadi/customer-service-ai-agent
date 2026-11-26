import { findAgent } from "@/lib/agents";
import { describeDeepgramError, env, jsonError, rateLimited, rejectCrossSite } from "@/lib/server";

const MAX_SPEAK_CHARS = 2000;

// Teks ke suara: Flux Deepgram hanya tersedia di /v2/speak. Suara MP3 diteruskan ke browser sambil diunduh.
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request) ?? rateLimited(request, "speak", 60);
  if (blocked) return blocked;
  if (!env.deepgramKey) return jsonError("DEEPGRAM_API_KEY belum diisi di .env.local.", 500);

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_SPEAK_CHARS) : "";
  if (!text) return jsonError("Teks yang mau dibacakan kosong.", 400);
  const voice = findAgent(body?.agentId).voice;

  let response: Response;
  try {
    response = await fetch(`${env.deepgramUrl}/v2/speak?model=${voice}&encoding=mp3`, {
      method: "POST",
      headers: { Authorization: `Token ${env.deepgramKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    return jsonError("Server tidak bisa terhubung ke Deepgram. Periksa koneksi internet.", 502);
  }
  if (!response.ok || !response.body) return jsonError(describeDeepgramError(response.status), 502);

  return new Response(response.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
