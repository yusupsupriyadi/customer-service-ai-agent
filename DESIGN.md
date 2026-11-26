# Design direction

Source: owner's brief (2026-11-26). Style like eksis.io, palette yellow + black + white, motion built with the Motion Format approach (HTML canvas, every movement computed from time `t`).

## Lembar gaya (Motion Format)

- Gaya: Promo Produk, arah "Pop berani" (promo aplikasi): stiker, bayangan keras bergeser, latar bertitik.
- Palet: kuning `#ffd400`, kuning lembut `#fff3a6`, hitam `#100f0d`, putih `#ffffff`, krem `#f6f4ec`. Teks hitam di atas kuning atau putih; kuning di atas hitam. Putih di atas kuning tidak dipakai (kontras gagal).
- Font: Plus Jakarta Sans 800 untuk judul dan stiker, 400 sampai 700 untuk teks; JetBrains Mono hanya untuk kode di tutorial.
- Bentuk: garis hitam 2,5 sampai 4 px, sudut 10 sampai 16 px, bayangan keras 4 sampai 7 px, stiker miring 1 sampai 3 derajat.
- Kamera dan lapisan di kanvas hero: latar hitam bertitik (bergeser pelan), ponsel agent (bergoyang `nz`), gelembung pertanyaan di depan.
- Tanda tangan gerak: gelembung pertanyaan bermata masuk memantul (squash and stretch, `E.back`), lalu dicap "dijawab". Judul halaman masuk dengan hentakan stiker (`slam`).
- Isi layar adalah contoh dan diberi label "Contoh panggilan"; tidak ada angka atau testimoni karangan.
- Aksesibilitas: tombol jeda untuk animasi yang berulang, satu frame diam saat pengguna memilih kurangi gerak, animasi berhenti saat kanvas tidak terlihat.

Dial: ENERGY 3 / RHYTHM 2 / MOTION 2.
