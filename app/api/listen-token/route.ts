import { describeDeepgramError, env, jsonError, rateLimited, rejectCrossSite } from "@/lib/server";

// nova-3 bahasa Indonesia. endpointing=500: kalimat ditutup setelah diam 0,5 detik.
// utterance_end_ms=1000: dipakai telepon untuk tahu pelanggan sudah selesai bicara.
const LISTEN_QUERY =
  "model=nova-3&language=id&smart_format=true&interim_results=true&endpointing=500&utterance_end_ms=1000";

// Browser tidak boleh memegang API key asli. Server membuat token sementara (30 detik)
// yang cukup untuk membuka WebSocket; sambungan tetap hidup setelah token kedaluwarsa.
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request) ?? rateLimited(request, "listen", 20);
  if (blocked) return blocked;
  if (!env.deepgramKey) return jsonError("DEEPGRAM_API_KEY belum diisi di .env.local.", 500);

  let response: Response;
  try {
    response = await fetch(`${env.deepgramUrl}/v1/auth/grant`, {
      method: "POST",
      headers: { Authorization: `Token ${env.deepgramKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl_seconds: 30 }),
    });
  } catch {
    return jsonError("Server tidak bisa terhubung ke Deepgram. Periksa koneksi internet.", 502);
  }
  const data = await response.json().catch(() => null);
  if (response.status === 403) {
    return jsonError("DEEPGRAM_API_KEY tidak punya izin membuat token. Buat key baru dengan peran Member atau lebih tinggi.", 502);
  }
  if (!response.ok || !data?.access_token) return jsonError(describeDeepgramError(response.status), 502);

  const socketBase = env.deepgramUrl.replace(/^http/, "ws");
  return Response.json(
    { token: data.access_token, url: `${socketBase}/v1/listen?${LISTEN_QUERY}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
