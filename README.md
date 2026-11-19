# Customer Service Agent (Contoh Project)

Web chat customer service sederhana yang menjawab pertanyaan pelanggan berdasarkan konteks yang Anda berikan: teks biasa dan dokumen PDF. Pelanggan bisa bertanya dengan mengetik, merekam suara, atau menelepon agent. Dibuat hanya dengan HTML, Tailwind, dan JavaScript, tanpa server.

## Cara menjalankan

1. Buka `index.html` di browser (klik dua kali file-nya), atau jalankan lewat ekstensi Live Server di VS Code.
2. Tempel API key Netra di kolom **API key Netra**.
3. Isi **Konteks teks** dengan info usaha, dan/atau pilih file PDF (misalnya daftar harga atau FAQ toko).
4. Ketik pertanyaan di kolom chat seolah-olah Anda pelanggan, lalu tekan Enter.
5. Untuk bertanya lewat suara, tempel juga API key Deepgram di kolom **API key Deepgram**, lalu:
   - tekan **Rekam**, bicara, lalu tekan **Selesai** (suara diubah menjadi teks lalu dikirim), atau
   - tekan **Telepon** untuk mengobrol langsung dengan agent seperti menelepon, lalu **Akhiri panggilan** kalau sudah.

Perlu koneksi internet, karena Tailwind, pembaca PDF (pdf.js), API Netra, dan API Deepgram dimuat dari internet. Fitur suara perlu mikrofon dan browser Chrome atau Edge terbaru.

## Struktur file

| File | Isi |
|------|-----|
| `index.html` | Aplikasi dan tutorial dalam satu file. Bagian atas berisi panel Pengaturan dan panel Chat, bagian bawah berisi tutorial empat tingkat (tombol "Baca tutorial" di header): Tingkat 1 memakai konteks teks saja, Tingkat 2 menambahkan konteks dari PDF, Tingkat 3 menambahkan pertanyaan lewat rekaman suara, dan Tingkat 4 menambahkan panggilan suara. Bagian `<script>` di akhir file membaca PDF, menyusun konteks, memanggil API, merekam suara, dan menampilkan chat. |

## Alur kerja

1. Teks dari kolom konteks dan dari setiap PDF digabung menjadi satu **konteks** (maksimal 60.000 karakter).
2. Konteks dimasukkan ke **system prompt**, yaitu aturan kerja agent: jawab hanya dari konteks, jangan mengarang harga atau kebijakan.
3. Setiap kali pelanggan bertanya, aplikasi mengirim system prompt beserta seluruh riwayat chat ke `https://api.netra.sh/v1/chat/completions`. Riwayat ikut dikirim karena API tidak mengingat percakapan sebelumnya.
4. Jawaban diambil dari `choices[0].message.content` lalu ditampilkan sebagai gelembung chat.

### Input suara (Tingkat 3)

1. Tombol **Rekam** merekam mikrofon dengan `MediaRecorder`.
2. Rekaman dikirim ke `https://api.deepgram.com/v1/listen` dengan model `nova-3` dan bahasa Indonesia (`language=id`).
3. Teks hasilnya dikirim lewat form chat, sama seperti pertanyaan yang diketik.

### Panggilan suara (Tingkat 4)

1. Tombol **Telepon** membuka WebSocket ke `wss://api.deepgram.com/v1/listen` dan mengirim potongan audio mikrofon setiap 250 milidetik.
2. Saat Deepgram mengirim `UtteranceEnd` (pelanggan diam 1 detik), teks pelanggan dikirim ke Netra dengan aturan tambahan: jawaban pendek dan angka ditulis dengan huruf.
3. Jawaban Netra dibacakan oleh text to speech Deepgram (`/v1/speak`, suara `aura-2-livia-it`) dan diputar sambil diunduh. Selama agent berpikir dan bicara, rekaman dijeda supaya suara agent tidak terekam.
4. Setelah agent selesai bicara, aplikasi kembali mendengarkan.

Deepgram belum punya suara Bahasa Indonesia. Suara Italia `aura-2-livia-it` dipilih karena paling mudah dikenali kembali oleh speech to text Deepgram saat membacakan teks Indonesia, dibanding beberapa suara Inggris dan Spanyol yang dicoba.

## Catatan keamanan

API key Netra dan Deepgram disimpan dan dipakai langsung di browser. Siapa pun yang membuka DevTools di komputer itu bisa melihatnya. Pola ini cukup untuk belajar, tetapi untuk website publik API key harus disimpan di server (backend), bukan di browser. Rekaman suara pelanggan dikirim ke server Deepgram untuk diubah menjadi teks.
