# Background Dasar, Transparansi, Crop, Font, Pustaka Media & Remove BG

## Yang akan ditambahkan

### 1. Background dasar di Tema Undangan
Panel Tema (saat tidak ada item terpilih) sekarang hanya punya 3 pilihan warna. Ditambah:
- Upload / URL **Gambar Background Dasar** (tampil di belakang seluruh kanvas 1080x1920, jadi section yang transparan akan menampakkannya).
- Pilihan **Gradient** dan **Overlay gelap (%)** untuk background dasar.
- Kontrol tampilan gambar: **cover / contain / repeat**, **posisi** (atas, kanan, bawah, kiri, tengah, dan sudut), **zoom (%)**, serta **rotasi**.

### 2. Transparan untuk Section & Subsection
- Tombol **Transparan** pada tab Design Section/Subsection: menghapus warna latar sehingga background dasar tema terlihat.
- Slider **Opacity latar (0-100%)** terpisah dari opacity elemen, jadi latar bisa semi-transparan tanpa membuat teksnya pudar.

### 3. Upload background di Section & Subsection
- Field "Background Image URL" diganti komponen upload gambar yang sama seperti field lain (pilih file dari perangkat atau tempel URL, dengan pratinjau).
- Subsection kini benar-benar merender `bgImage`, gradient, dan overlay-nya (saat ini hanya Section yang merender).

### 4. Crop / Rotate / Posisi gambar latar
Untuk Tema, Section, dan Subsection:
- **Posisi**: atas, atas-kanan, kanan, bawah-kanan, bawah, bawah-kiri, kiri, atas-kiri, tengah.
- **Mode**: cover (crop otomatis), contain, fill, repeat.
- **Zoom / skala** untuk mengatur seberapa dekat crop-nya.
- **Rotate** latar 0-360 derajat (rotasi hanya pada lapisan latar, teks tetap tegak).
- **Offset X / Y (%)** untuk menggeser titik crop secara halus.

### 5. Pemilih Font (khas undangan) + input manual
- Daftar dasar font yang umum dipakai undangan pernikahan: Great Vibes, Parisienne, Dancing Script, Pinyon Script, Sacramento, Allura, Italianno, Playfair Display, Cormorant Garamond, EB Garamond, Marcellus, Cinzel, Libre Baskerville, Lora, Jost, Montserrat, Raleway, Quicksand.
- Semua dimuat lewat tag `<link>` Google Fonts di root route.
- Dropdown **Font Heading** dan **Font Body** di panel Tema, dengan pratinjau tiap nama font memakai font itu sendiri.
- Opsi **"Tulis manual..."** pada dropdown: cukup masukkan nama font (mis. `Tangerine`), sistem otomatis memuatnya dari Google Fonts saat itu juga.
- Dropdown Font Family yang sama tersedia di tab Design untuk Section / Subsection / Field, plus opsi "Ikuti tema".

### 6. Pustaka Media (pakai ulang file yang sudah diupload)
- Tab/dialog **Pustaka Media** di editor: menampilkan grid semua foto, video, dan audio yang pernah diupload (dari tabel media yang sudah ada), dengan pencarian nama, filter jenis, dan hapus.
- Setiap komponen upload (background tema/section/subsection, field gambar, galeri foto) mendapat tombol **Pilih dari Pustaka** di samping tombol upload, jadi tidak perlu unggah ulang.
- **Dedup otomatis**: file yang diupload dihitung sidik jarinya (SHA-256); jika sudah pernah ada, sistem memakai URL yang lama tanpa menyimpan file kedua — hemat penyimpanan dan halaman lebih ringan karena URL yang sama dipakai berulang (di-cache browser).
- Galeri foto bisa memilih beberapa item dari pustaka sekaligus.


## Detail teknis

- `src/lib/builder/types.ts`: tambah `bgSize`, `bgPosition`, `bgRepeat`, `bgZoom`, `bgRotate`, `bgOffsetX/Y`, `bgOpacity`, `transparent` pada `StyleConfig`; tambah `bgImage`, `bgGradient`, `overlay`, dan properti latar yang sama pada `ThemeConfig`.
- `src/lib/builder/style.ts`: helper `bgLayerStyle(style)` yang mengubah properti di atas menjadi CSS (`backgroundSize`, `backgroundPosition`, `transform: rotate/scale`), dipakai oleh lapisan latar terpisah.
- `src/components/invitation/InvitationRenderer.tsx`: render lapisan latar tema di wrapper kanvas; Section & Subsection memakai div lapisan latar absolut (agar rotate/zoom/opacity latar tidak mempengaruhi konten) plus overlay; hormati flag `transparent`.
- `src/routes/admin.tsx`: pindahkan `ImageInput`/`useUpload` agar bisa dipakai panel Tema dan Design; tambah grup kontrol "Latar & Crop", `FontSelect` (daftar + mode manual), dan dialog `MediaLibrary`.
- `src/lib/builder/fonts.ts`: daftar font undangan + helper `googleFontHref(names)` untuk memuat font yang ditulis manual secara dinamis.
- `src/routes/__root.tsx`: tambahkan `<link>` Google Fonts untuk daftar dasar (bukan `@import` di CSS); font manual disuntik lewat `<link>` runtime.
- `src/lib/invitation.functions.ts`: `uploadMedia` menerima `sha256` dan mengecek tabel `media` lebih dulu — jika sudah ada, kembalikan URL lama tanpa upload; tambah `listMedia` dan `deleteMedia` (admin-only, lewat service role seperti fungsi lain).
- Migrasi: tambah kolom `hash text`, `size bigint`, `content_type text` pada `public.media` + indeks unik pada `hash`; tabel tetap tanpa akses klien langsung (diakses hanya via server function).


### 7. Hapus Background Gambar (Remove BG) + koreksi manual + border
- Tombol **Hapus Latar** pada setiap komponen gambar (background tema/section/subsection, field gambar, galeri, pustaka media). Berjalan **di browser** memakai `@imgly/background-removal` (WASM, tanpa biaya, ~2-5 detik per foto). Tanpa AI.
- **Koreksi manual** setelah proses otomatis: kanvas kecil dengan kuas **Hapus** dan **Pulihkan**, ukuran kuas bisa diatur, plus Undo dan Reset — untuk merapikan sisa latar atau bagian yang terlalu terpotong.
- Pratinjau sebelum/sesudah dengan latar kotak-kotak (transparansi terlihat), lalu tombol "Pakai" atau "Batal". Hasil disimpan sebagai PNG transparan baru di pustaka media; foto asli tetap utuh.
- **Border/outline pada objek hasil potong**: setelah latar dihapus, tersedia kontrol **Tebal garis (px)**, **Warna garis**, dan **Halus (feather)** yang menggambar garis tepi mengikuti bentuk objek — bukan kotak. Ada juga opsi **Bayangan halus** agar objek menyatu dengan latar undangan. Semua bisa diubah lagi kapan pun karena tersimpan sebagai pengaturan gambar.

Catatan teknis tambahan:
- `bun add @imgly/background-removal`; dipanggil lewat dynamic import di sisi klien saja agar tidak masuk bundel SSR.
- Editor koreksi manual + border memakai `<canvas>`: masker alpha disimpan sebagai layer terpisah; garis tepi dihasilkan dari dilatasi masker alpha (beberapa lapis `drawImage` bergeser + `globalCompositeOperation`), lalu digabung dan diekspor sebagai PNG.
- Hasil PNG diunggah lewat jalur `uploadMedia` + dedup hash yang sama, jadi gambar yang sudah pernah diproses tidak tersimpan dua kali.

