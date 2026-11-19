# Customer Service Agent (Contoh Project)

Web chat customer service sederhana yang menjawab pertanyaan pelanggan berdasarkan konteks yang Anda berikan: teks biasa dan dokumen PDF. Pelanggan bisa bertanya dengan mengetik, merekam suara, atau menelepon agent. Dibuat hanya dengan HTML, Tailwind, dan JavaScript, tanpa server.

## Cara menjalankan

1. Buka `index.html` di browser (klik dua kali file-nya), atau jalankan lewat ekstensi Live Server di VS Code.
2. Tempel API key Netra di kolom **API key Netra**.
3. Isi **Konteks teks** dengan info usaha, dan/atau pilih file PDF (misalnya daftar harga atau FAQ toko).
4. Ketik pertanyaan di kolom chat seolah-olah Anda pelanggan, lalu tekan Enter. Pilihan **Reasoning** (Mati, Rendah, Tinggi) mengatur seberapa lama model berpikir: makin tinggi makin teliti tetapi makin lambat. Untuk Telepon, Mati atau Rendah membuat agent menjawab lebih cepat.
5. Untuk bertanya lewat suara, tempel juga API key Deepgram di kolom **API key Deepgram**, lalu:
   - tekan tombol **mic**, lalu bicara: teksnya muncul langsung di kolom pertanyaan. Tekan tombol mic lagi untuk mengirim, atau
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

1. Tombol **mic** membuka mikrofon dan WebSocket ke `wss://api.deepgram.com/v1/listen` (model `nova-3`, bahasa Indonesia `language=id`), lalu mengirim potongan audio setiap 250 milidetik.
2. Deepgram membalas dengan teks sementara dan teks final, dan teksnya langsung tampil di kolom pertanyaan selagi pelanggan bicara.
3. Saat tombol mic ditekan lagi, aplikasi mengirim `CloseStream`, menunggu teks terakhir, lalu mengirim teks final lewat form chat, sama seperti pertanyaan yang diketik.

### Panggilan suara (Tingkat 4)

1. Tombol **Telepon** membuka WebSocket yang sama dan mengirim potongan audio mikrofon setiap 250 milidetik selama panggilan.
2. Saat Deepgram mengirim `UtteranceEnd` (pelanggan diam 1 detik), teks pelanggan dikirim ke Netra dengan aturan tambahan: bahasa lisan yang sopan, jawaban pendek, dan angka ditulis dengan huruf. Kalau jawaban belum siap dalam 1 detik, agent bilang "sebentar ya Kak, saya cek dulu" (dan "masih saya cek" kalau lama), lalu membuka jawaban dengan "makasih sudah menunggu". Agent menyapa sesuai jam dan memperkenalkan diri sebagai Fitri.
3. Jawaban Netra dibacakan oleh text to speech Flux Deepgram (`/v2/speak`, suara Indonesia `flux-fitri-id`) dan diputar sambil diunduh. Selama agent berpikir dan bicara, rekaman dijeda supaya suara agent tidak terekam.
4. Setelah agent selesai bicara, aplikasi kembali mendengarkan.

Model Flux hanya tersedia di `/v2/speak`, bukan `/v1/speak`. Prompt telepon meminta angka dan jam ditulis dengan huruf, karena saat diuji jam "17.00" dibaca "satu tujuh ribu".

## Catatan keamanan

API key Netra dan Deepgram disimpan dan dipakai langsung di browser. Siapa pun yang membuka DevTools di komputer itu bisa melihatnya. Pola ini cukup untuk belajar, tetapi untuk website publik API key harus disimpan di server (backend), bukan di browser. Rekaman suara pelanggan dikirim ke server Deepgram untuk diubah menjadi teks.
