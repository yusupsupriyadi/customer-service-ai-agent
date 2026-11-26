import "server-only";

// Semua key dibaca dari .env.local di server, tidak pernah dikirim ke browser.
export const env = {
  netraKey: process.env.NETRA_API_KEY?.trim() ?? "",
  netraModel: process.env.NETRA_MODEL?.trim() || "deepseek/deepseek-v4.1-flash",
  netraUrl: process.env.NETRA_API_URL?.trim() || "https://api.netra.sh/v1/chat/completions",
  deepgramKey: process.env.DEEPGRAM_API_KEY?.trim() ?? "",
  deepgramUrl: (process.env.DEEPGRAM_API_URL?.trim() || "https://api.deepgram.com").replace(/\/$/, ""),
};

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

// Route API hanya melayani halaman dari website ini sendiri, bukan website lain.
export function rejectCrossSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    // origin rusak dianggap dari luar
  }
  return jsonError("Permintaan dari website lain ditolak.", 403);
}

// Batas sederhana per alamat IP supaya key tidak dihabiskan satu pengguna.
const hits = new Map<string, number[]>();
export function rateLimited(request: Request, bucket: string, perMinute: number) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "lokal";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > perMinute
    ? jsonError("Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.", 429)
    : null;
}

export function describeDeepgramError(status: number) {
  if (status === 401 || status === 403) return "DEEPGRAM_API_KEY ditolak. Periksa key di .env.local.";
  if (status === 402) return "Saldo Deepgram habis.";
  if (status === 429) return "Terlalu banyak permintaan ke Deepgram. Tunggu sebentar, lalu coba lagi.";
  if (status >= 500) return "Server Deepgram sedang bermasalah. Coba lagi beberapa saat lagi.";
  return `Deepgram menolak permintaan (kode ${status}).`;
}
