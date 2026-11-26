import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Tutorial CS Agent dengan Next.js",
  description: "Panduan empat tingkat membuat customer service agent dengan Next.js, Netra, dan Deepgram.",
};

// Kode di tutorial dibaca langsung dari file project saat build, jadi selalu sama dengan aplikasinya.
function CodeFile({ file }: { file: string }) {
  const code = readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8").trim();
  return (
    <figure className="mt-4">
      <figcaption className="inline-block rounded-t-lg border-[2.5px] border-b-0 border-ink bg-yellow px-3 py-1 font-mono text-xs font-bold">{file}</figcaption>
      <pre tabIndex={0} className="max-h-[32rem] overflow-auto rounded-b-xl rounded-tr-xl border-[2.5px] border-ink bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

const TOC = [
  ["persiapan", "Persiapan"],
  ["struktur", "Struktur project"],
  ["tingkat-1", "Tingkat 1: Chat dari konteks teks"],
  ["tingkat-2", "Tingkat 2: Konteks dari PDF"],
  ["tingkat-3", "Tingkat 3: Dikte suara"],
  ["tingkat-4", "Tingkat 4: Telepon dan pilihan agent"],
  ["masalah", "Masalah yang sering muncul"],
  ["latihan", "Latihan"],
];

const PROBLEMS = [
  ["Isi NETRA_API_KEY dan DEEPGRAM_API_KEY di .env.local", "File .env.local belum ada atau key-nya kosong. Salin .env.example, isi key, lalu hentikan dan jalankan ulang npm run dev. Next.js hanya membaca .env.local saat server mulai."],
  ["NETRA_API_KEY ditolak", "Status 401: key salah ketik, kedaluwarsa, atau sudah dicabut. Buat key baru di dashboard Netra."],
  ["Saldo atau kuota Netra habis", "Status 402: isi saldo di menu Billing Netra."],
  ["DEEPGRAM_API_KEY ditolak", "Key salah, atau perannya di bawah Member. Membuat token sementara butuh key dengan peran Member atau lebih tinggi."],
  ["Izin mikrofon ditolak", "Klik ikon di kiri alamat web, ubah izin Mikrofon menjadi Izinkan, lalu muat ulang halaman. Buka lewat http://localhost, bukan alamat IP, karena mikrofon hanya diizinkan di localhost atau https."],
  ["(tidak ada teks, mungkin hasil scan)", "PDF berisi gambar. Pakai PDF yang teksnya bisa diblok, atau ketik ulang isinya di Info usaha."],
  ["Browser menahan suara agent", "Browser baru mau memutar suara setelah pengguna mengklik halaman. Klik di mana saja, lalu coba lagi."],
];

export default function TutorialPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="dots bg-yellow">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-6xl">
            Bikin CS Agent <span className="sticker-big mt-2 -rotate-1">pakai Next.js</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium">Panduan untuk siswa SMK kelas 11. Kerjakan berurutan: selesaikan satu tingkat sampai jalan, baru lanjut.</p>

          <div className="mt-12 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <nav aria-label="Daftar isi" className="card self-start p-3 lg:sticky lg:top-4">
              <p className="px-2 pt-1 text-lg font-extrabold">Daftar isi</p>
              <ol className="mt-2">
                {TOC.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="block rounded-lg px-2 py-2 text-sm font-bold hover:bg-yellow-soft">{label}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className="card min-w-0 space-y-14 p-5 sm:p-8 [&_a]:font-bold [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_h2]:scroll-mt-6 [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-extrabold [&_li]:mt-1.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-cream [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]">
              <section id="persiapan" aria-labelledby="persiapan-title">
                <h2 id="persiapan-title">Persiapan</h2>
                <ul>
                  <li>Node.js 20 atau lebih baru, VS Code, dan browser Chrome atau Edge.</li>
                  <li>API key Netra: masuk ke <a href="https://app.netraruntime.com/dashboard">dashboard Netra</a>, isi saldo di Billing, lalu buat key di menu API Keys.</li>
                  <li>API key Deepgram: buat di <a href="https://console.deepgram.com">Deepgram Console</a>, menu Settings, API Keys. Pilih peran Member supaya server bisa membuat token sementara.</li>
                </ul>
                <h3>Menjalankan project</h3>
                <ol>
                  <li>Jalankan <code>npm install</code> di folder project.</li>
                  <li>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi <code>NETRA_API_KEY</code> dan <code>DEEPGRAM_API_KEY</code>.</li>
                  <li>Jalankan <code>npm run dev</code>, lalu buka <code>http://localhost:3000</code>.</li>
                </ol>
                <p>Key hanya ada di <code>.env.local</code> dan dibaca oleh server. Browser tidak pernah melihat key aslinya, jadi aman walau halamannya dibuka orang lain. File <code>.env.local</code> sudah masuk <code>.gitignore</code>, jangan pernah di-commit.</p>
                <CodeFile file=".env.example" />
              </section>

              <section id="struktur" aria-labelledby="struktur-title">
                <h2 id="struktur-title">Struktur project</h2>
                <pre tabIndex={0} className="mt-4 overflow-auto rounded-xl border-[2.5px] border-ink bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper">{`app/
  page.tsx                halaman utama: hero, pilihan agent, studio
  tutorial/page.tsx       halaman ini
  api/chat/route.ts       meneruskan pertanyaan ke Netra (key di server)
  api/speak/route.ts      mengubah teks jadi suara Flux Deepgram
  api/listen-token/       membuat token sementara untuk WebSocket Deepgram
  api/status/route.ts     memberi tahu key mana yang sudah diisi
components/
  studio.tsx              pilihan agent, panel pengetahuan, chat, telepon
  hero-scene.tsx          animasi kanvas di bagian atas
lib/
  agents.ts               daftar agent dan suaranya
  prompt.ts               system prompt
  client.ts               fetch ke route API dan pembaca PDF
  voice.ts                dikte dan telepon`}</pre>
                <p>Alurnya: browser mengirim pertanyaan ke route di server kita sendiri (<code>/api/chat</code>). Route itu menambahkan key dari <code>.env.local</code>, lalu meneruskannya ke Netra atau Deepgram.</p>
              </section>

              <section id="tingkat-1" aria-labelledby="tingkat-1-title">
                <p className="sticker text-sm font-extrabold">Tingkat 1: Dasar</p>
                <h2 id="tingkat-1-title" className="mt-3">Chat dari konteks teks</h2>
                <p>System prompt adalah aturan kerja agent: jawab hanya dari KONTEKS, jangan mengarang harga. Fungsi ini juga memasukkan nama dan gaya bicara agent yang dipilih.</p>
                <CodeFile file="lib/prompt.ts" />
                <p>Route Handler adalah fungsi yang berjalan di server saat browser memanggil <code>POST /api/chat</code>. Di sini key Netra dipakai, riwayat chat dibatasi, dan pesan error diterjemahkan.</p>
                <CodeFile file="app/api/chat/route.ts" />
                <p>Di browser, <code>askAgent</code> di <code>lib/client.ts</code> cukup memanggil <code>fetch(&quot;/api/chat&quot;)</code>. Riwayat chat ikut dikirim setiap kali, karena API tidak mengingat percakapan sebelumnya.</p>
                <h3>Mencoba</h3>
                <ol>
                  <li>Tulis di Info usaha: &quot;Buka setiap hari 08.00 sampai 17.00. Ongkir dalam kota 10 ribu.&quot;</li>
                  <li>Tanya &quot;Ongkir dalam kota berapa?&quot;. Jawabannya harus dari info itu.</li>
                  <li>Tanya &quot;Ada promo?&quot;. Agent harus bilang belum punya informasinya.</li>
                </ol>
              </section>

              <section id="tingkat-2" aria-labelledby="tingkat-2-title">
                <p className="sticker text-sm font-extrabold">Tingkat 2</p>
                <h2 id="tingkat-2-title" className="mt-3">Konteks dari PDF</h2>
                <p>Teks PDF dibaca langsung di browser dengan <code>pdfjs-dist</code>, lalu digabung dengan Info usaha. Library baru dimuat saat ada PDF, jadi halaman awal tetap ringan. Lihat fungsi <code>extractPdfText</code> di <code>lib/client.ts</code>.</p>
                <p>Konteks dibatasi 60.000 karakter (sekitar 15 ribu token). Studio menampilkan peringatan kuning bila batasnya terlewati.</p>
              </section>

              <section id="tingkat-3" aria-labelledby="tingkat-3-title">
                <p className="sticker text-sm font-extrabold">Tingkat 3</p>
                <h2 id="tingkat-3-title" className="mt-3">Dikte suara</h2>
                <p>Suara mikrofon dikirim ke Deepgram lewat WebSocket. Masalahnya, key asli tidak boleh sampai ke browser. Solusinya: server membuat token sementara yang berlaku 30 detik. Token cukup untuk membuka sambungan, dan sambungan tetap hidup setelah token kedaluwarsa.</p>
                <CodeFile file="app/api/listen-token/route.ts" />
                <p>Browser membuka WebSocket dengan <code>new WebSocket(url, [&quot;bearer&quot;, token])</code>, lalu mengirim potongan audio setiap 250 milidetik. Deepgram membalas teks sementara dan teks final, dan teksnya langsung tampil di kolom pertanyaan. Lihat kelas <code>Dictation</code> di <code>lib/voice.ts</code>.</p>
              </section>

              <section id="tingkat-4" aria-labelledby="tingkat-4-title">
                <p className="sticker text-sm font-extrabold">Tingkat 4: Paling menantang</p>
                <h2 id="tingkat-4-title" className="mt-3">Telepon dan pilihan agent</h2>
                <p>Telepon menjalankan putaran tanpa henti: Deepgram mendengarkan, Netra menjawab, Deepgram membacakan jawaban, lalu kembali mendengarkan. Saat Deepgram mengirim <code>UtteranceEnd</code> (pelanggan diam 1 detik), pertanyaannya dikirim ke <code>/api/chat</code> dengan aturan bahasa lisan.</p>
                <p>Tiap agent adalah pasangan suara Flux Bahasa Indonesia dan gaya bicara. Untuk menambah agent, cukup tambah satu baris di daftar ini.</p>
                <CodeFile file="lib/agents.ts" />
                <p>Suara dibuat oleh route <code>/api/speak</code>. Model Flux hanya tersedia di <code>/v2/speak</code>. Suara MP3 diteruskan ke browser sambil diunduh, jadi agent mulai bicara lebih cepat.</p>
                <CodeFile file="app/api/speak/route.ts" />
                <p>Kalau jawaban Netra belum siap dalam 1 detik, agent bilang &quot;sebentar ya Kak, saya cek dulu&quot;, persis seperti CS sungguhan. Selama agent bicara, rekaman dijeda supaya suaranya sendiri tidak terdengar sebagai suara pelanggan. Logika lengkapnya ada di kelas <code>CallSession</code> di <code>lib/voice.ts</code>.</p>
              </section>

              <section id="masalah" aria-labelledby="masalah-title">
                <h2 id="masalah-title">Masalah yang sering muncul</h2>
                <dl className="mt-4 divide-y-2 divide-ink overflow-hidden rounded-xl border-[2.5px] border-ink">
                  {PROBLEMS.map(([title, detail]) => (
                    <div key={title} className="grid gap-1 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                      <dt className="font-extrabold">{title}</dt>
                      <dd className="text-muted">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section id="latihan" aria-labelledby="latihan-title">
                <h2 id="latihan-title">Latihan</h2>
                <ol>
                  <li>Tambahkan agent keenam dengan suara Flux bahasa lain, misalnya <code>flux-izzah-ms</code> (Melayu). Daftar suara ada di <a href="https://developers.deepgram.com/docs/flux-tts/voices">dokumentasi Deepgram</a>.</li>
                  <li>Kirim hanya 10 pesan terakhir ke <code>/api/chat</code> supaya token lebih hemat.</li>
                  <li>Tampilkan lama rekaman dalam detik selagi dikte berjalan.</li>
                  <li>Tantangan: tampilkan jawaban sedikit demi sedikit dengan streaming. Baca <a href="https://netra.sh/docs/streaming">panduan streaming Netra</a>.</li>
                </ol>
                <p><Link href="/#studio">Kembali ke studio</Link></p>
              </section>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
