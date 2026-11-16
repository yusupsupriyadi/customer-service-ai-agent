# Customer Service Agent (Contoh Project)

Web chat customer service sederhana yang menjawab pertanyaan pelanggan berdasarkan konteks yang Anda berikan: teks biasa dan dokumen PDF. Dibuat hanya dengan HTML, Tailwind, dan JavaScript, tanpa server.

## Cara menjalankan

1. Buka `index.html` di browser (klik dua kali file-nya), atau jalankan lewat ekstensi Live Server di VS Code.
2. Tempel API key Netra di kolom **API key Netra**.
3. Isi **Konteks teks** dengan info usaha, dan/atau pilih file PDF (misalnya daftar harga atau FAQ toko).
4. Ketik pertanyaan di kolom chat seolah-olah Anda pelanggan, lalu tekan Enter.

Perlu koneksi internet, karena Tailwind, pembaca PDF (pdf.js), dan API Netra dimuat dari internet.

## Struktur file

| File | Isi |
|------|-----|
| `index.html` | Aplikasi dan tutorial dalam satu file. Bagian atas berisi panel Pengaturan dan panel Chat, bagian bawah berisi tutorial langkah demi langkah (tombol "Baca tutorial" di header). Bagian `<script>` di akhir file membaca PDF, menyusun konteks, memanggil API, dan menampilkan chat. |

## Alur kerja

1. Teks dari kolom konteks dan dari setiap PDF digabung menjadi satu **konteks** (maksimal 60.000 karakter).
2. Konteks dimasukkan ke **system prompt**, yaitu aturan kerja agent: jawab hanya dari konteks, jangan mengarang harga atau kebijakan.
3. Setiap kali pelanggan bertanya, aplikasi mengirim system prompt beserta seluruh riwayat chat ke `https://api.netra.sh/v1/chat/completions`. Riwayat ikut dikirim karena API tidak mengingat percakapan sebelumnya.
4. Jawaban diambil dari `choices[0].message.content` lalu ditampilkan sebagai gelembung chat.

## Catatan keamanan

API key disimpan dan dipakai langsung di browser. Siapa pun yang membuka DevTools di komputer itu bisa melihatnya. Pola ini cukup untuk belajar, tetapi untuk website publik API key harus disimpan di server (backend), bukan di browser.
