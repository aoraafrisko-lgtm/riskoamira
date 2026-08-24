# Background Dasar, Transparansi, Crop/Posisi Gambar & Pemilih Font

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

### 5. Pemilih Font
- Muat koleksi font Google (heading & body: Cormorant Garamond, Playfair Display, Great Vibes, Parisienne, Marcellus, Jost, Inter, Lora, Montserrat, Poppins, dan beberapa lain) lewat tag `<link>` di root.
- Dropdown **Font Heading** dan **Font Body** di panel Tema, dengan pratinjau nama font memakai font itu sendiri.
- Dropdown **Font Family** di tab Design untuk Section / Subsection / Field, memakai daftar font yang sama plus opsi "Ikuti tema".

## Detail teknis

- `src/lib/builder/types.ts`: tambah `bgSize`, `bgPosition`, `bgRepeat`, `bgZoom`, `bgRotate`, `bgOffsetX/Y`, `bgOpacity`, `transparent` pada `StyleConfig`; tambah `bgImage`, `bgGradient`, `overlay`, dan properti latar yang sama pada `ThemeConfig`.
- `src/lib/builder/style.ts`: helper `bgLayerStyle(style)` yang mengubah properti di atas menjadi CSS (`backgroundSize`, `backgroundPosition`, `transform: rotate/scale`), dipakai oleh lapisan latar terpisah.
- `src/components/invitation/InvitationRenderer.tsx`: render lapisan latar tema di wrapper kanvas; Section & Subsection memakai div lapisan latar absolut (agar rotate/zoom/opacity latar tidak mempengaruhi konten) plus overlay; hormati flag `transparent`.
- `src/routes/admin.tsx`: pindahkan `ImageInput`/`useUpload` agar bisa dipakai panel Tema dan Design; tambah grup kontrol "Latar & Crop" dan `FontSelect` yang dipakai bersama; daftar font di `src/lib/builder/fonts.ts`.
- `src/routes/__root.tsx`: tambahkan `<link>` Google Fonts (bukan `@import` di CSS).
