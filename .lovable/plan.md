# Cover Opening + Navigasi Section

Menambahkan pengalaman pembuka undangan: layar cover mewah dengan tombol "Buka Undangan", lalu masuk ke Section 1, plus navigasi cepat antar section.

## 1. Cover (Section pertama sebagai cover)

- Section pertama pada config diperlakukan sebagai cover saat mode publik.
- Cover ditampilkan penuh (1080×1920, sama seperti section lain) dengan tombol **Buka Undangan** di bawah, ditambah sapaan tamu (`Kepada: <nama tamu>`) bila ada token `?guest=`.
- Sebelum dibuka: hanya cover yang terlihat, scroll dikunci, dan opsional musik/animasi belum jalan.
- Efek "wah" saat dibuka: cover zoom-in ringan + fade keluar, konten undangan fade/slide masuk, lalu otomatis scroll ke Section 1 (section setelah cover). Animasi murni CSS/transform agar tetap ringan dan tidak mengubah ukuran kanvas.
- Tombol cover memakai warna aksen tema (`theme.accentColor`) dengan shimmer/pulse halus, jadi ikut tema yang sudah ada.

## 2. Navigasi Section

- Tombol bulat mengapung (kanan bawah kanvas) muncul setelah undangan dibuka.
- Diketuk → panel daftar section (memakai `section.name`, melewati section yang `hidden` dan cover).
- Memilih section → scroll halus ke section tersebut; indikator menandai section aktif.
- Panel bisa ditutup, tidak mengganggu tampilan saat idle.

## 3. Editor Admin

- Preview editor tidak dikunci oleh cover (tetap bisa mengedit semua section langsung).
- Ada tombol kecil untuk mencoba pengalaman cover/opening dari editor pada mode preview fullscreen.
- Nama section di panel Struktur otomatis dipakai sebagai label navigasi, jadi tidak ada setting baru yang perlu diisi.

## Catatan teknis

- Komponen baru: `src/components/invitation/CoverGate.tsx` (overlay cover + animasi buka) dan `src/components/invitation/SectionNav.tsx` (tombol + daftar section).
- `src/routes/index.tsx`: state `opened`, render `CoverGate` di atas `CanvasStage`, kunci scroll saat belum dibuka, dan scroll ke section pertama non-cover setelah dibuka.
- Scroll memakai `data-section-id` yang sudah dirender `InvitationRenderer` (`scrollIntoView({ behavior: "smooth" })`), section aktif dideteksi dengan `IntersectionObserver`.
- Tidak mengubah skema database maupun struktur config; semua murni presentasi.
