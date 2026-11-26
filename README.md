# CS Agent (Contoh Project)

Agent customer service yang menjawab pertanyaan pelanggan dari info usaha yang kamu berikan (teks dan PDF), lewat chat, dikte suara, atau telepon. Ada lima pilihan agent dengan suara Flux Deepgram Bahasa Indonesia: Fitri, Dewi, Fajar, Rizky, dan Teguh. Dibuat dengan Next.js 16, Tailwind CSS 4, Netra (model AI), dan Deepgram (suara).

## Cara menjalankan

1. `npm install`
2. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `NETRA_API_KEY`: key dari dashboard Netra.
   - `DEEPGRAM_API_KEY`: key dari Deepgram Console, peran Member atau lebih tinggi.
   - `NETRA_MODEL` (opsional): bawaannya `deepseek/deepseek-v4.1-flash`.
3. `npm run dev`, lalu buka http://localhost:3000.

Next.js hanya membaca `.env.local` saat server mulai, jadi jalankan ulang `npm run dev` setelah mengubah key. Badge di bagian Studio menunjukkan key mana yang belum diisi.

## Struktur

| Path | Isi |
|------|-----|
| `app/page.tsx` | Halaman utama: hero dengan animasi kanvas, pilihan agent, studio tes. |
| `app/tutorial/page.tsx` | Tutorial empat tingkat untuk kelas 11. Kode di dalamnya dibaca langsung dari file project. |
| `app/api/chat/route.ts` | Meneruskan pertanyaan ke Netra dengan key dari env. System prompt disusun di server. |
| `app/api/speak/route.ts` | Teks ke suara Flux Deepgram (`/v2/speak`), suara MP3 diteruskan sambil diunduh. |
| `app/api/listen-token/route.ts` | Membuat token Deepgram sementara (30 detik) untuk WebSocket speech to text di browser. |
| `app/api/status/route.ts` | Memberi tahu key mana yang sudah diisi, tanpa isi key-nya. |
| `components/studio.tsx` | Pilihan agent, panel pengetahuan, chat, mic, dan bar telepon. |
| `components/hero-scene.tsx`, `lib/motion.ts` | Animasi kanvas bergaya Motion Format: semua gerak dihitung dari waktu `t`. |
| `lib/agents.ts` | Daftar agent: suara Flux dan gaya bicara. |
| `lib/voice.ts` | Dikte suara dan putaran telepon (dengar, jawab, bacakan, dengar lagi). |

## Keamanan

API key hanya ada di `.env.local` (tidak di-commit) dan dipakai oleh route API di server. Browser hanya menerima token Deepgram sementara. Route API menolak permintaan dari website lain dan membatasi jumlah permintaan per IP. Rekaman suara pelanggan tetap dikirim ke Deepgram untuk diubah menjadi teks.

## Hosting

Aplikasi ini butuh server (route API), jadi tidak bisa lagi berjalan di GitHub Pages. Pakai hosting Next.js seperti Vercel, dan isi `NETRA_API_KEY` serta `DEEPGRAM_API_KEY` di pengaturan environment variable hosting.
