# Resize & Crop Interaktif Langsung di Objek

Saat ini field mode "bebas" hanya punya **satu titik** di kanan-bawah dan itu hanya mengubah **lebar**. Tinggi selalu mengikuti isi (gambar jadi terkunci rasionya), jadi terasa "auto 3x4" dan sisi kiri/atas/bawah tidak bisa ditarik.

## Yang akan dibuat

### 1. Delapan titik resize di sekeliling objek
Saat field terpilih (mode bebas), muncul handle di:
- 4 sudut: kiri-atas, kanan-atas, kiri-bawah, kanan-bawah
- 4 sisi: kiri, kanan, atas, bawah

Menarik sisi **kiri** memperkecil dari kiri (tepi kanan tetap di tempat), menarik **atas** memperkecil dari atas (tepi bawah tetap), begitu juga sebaliknya — jadi objek tidak "melompat" saat dikecilkan.

### 2. Tinggi bisa diatur bebas (bukan lagi auto)
Field bebas mendapat tinggi eksplisit. Selama belum pernah ditarik, tinggi tetap otomatis seperti sekarang; begitu sisi atas/bawah ditarik, tinggi menjadi nilai tetap. Ada tombol **Tinggi Otomatis** untuk kembali ke auto.

### 3. Gambar: kecil-besar = crop, bukan gepeng
Gambar mengisi kotak dengan `object-fit: cover`, jadi mengubah kotak berarti **meng-crop** (tidak melar/penyet). Tersedia:
- Pilihan **Isi (crop)** / **Muat utuh** / **Penuhi (boleh melar)**
- **Titik fokus crop** (9 posisi: atas, kanan, tengah, dst.) supaya bagian penting tidak terpotong
- Tarik sudut dengan **Shift** = jaga rasio; tanpa Shift = bebas

### 4. Bantuan saat menarik
- Tooltip live menampilkan `x`, `y`, `w`, `h`
- **Shift** = snap ke grid (dan jaga rasio di sudut)
- Panah keyboard tetap untuk geser; **Shift+panah** lebih cepat
- Handle tetap berukuran nyaman disentuh walaupun kanvas diperkecil (kompensasi skala)

### 5. Panel Design
Di tab Design (posisi bebas) ditambah input **H (px)**, tombol **Tinggi Otomatis**, pilihan mode isi gambar, dan titik fokus crop — semua sinkron dengan hasil tarikan di kanvas.

## Detail teknis

- `src/lib/builder/types.ts`: tambah `h?: number` pada `FreePos`; tambah `fit?: "cover" | "contain" | "fill"` dan `focal?: BgPosition` pada `StyleConfig`.
- `src/components/invitation/InvitationRenderer.tsx` (`FreeField`):
  - ganti satu handle jadi array 8 handle dengan `dir` (`n`,`s`,`e`,`w`,`ne`,`nw`,`se`,`sw`); satu fungsi `startResize(dir)` menghitung delta dan menyesuaikan `x/y/w/h` sesuai anchor sisi berlawanan.
  - `dx` dikonversi ke persen lebar kanvas, `dy` ke px logis (dibagi zoom kanvas) — pakai `canvasRef` seperti sekarang.
  - clamp minimum (`w >= 3%`, `h >= 16px`), Shift untuk snap/lock rasio memakai rasio awal `base.w / base.h`.
  - wrapper memakai `height: pos.h` bila ada, dan `overflow: hidden` agar crop terlihat; konten anak diberi `height: 100%`.
  - ukuran handle dibagi zoom agar tetap mudah ditarik.
- `src/components/invitation/FieldRenderer.tsx`: gambar/galeri/avatar memakai `objectFit` dari `style.fit ?? "cover"`, `objectPosition` dari `style.focal`, dan `height: "100%"` saat berada dalam kotak bertinggi tetap (dideteksi lewat CSS `height: inherit`/wrapper, tanpa mengubah tampilan field alur biasa).
- `src/routes/admin.tsx`: `patchPos` menerima `h`; tambah input H, tombol reset tinggi, `Select` mode isi + titik fokus di grup posisi bebas.
