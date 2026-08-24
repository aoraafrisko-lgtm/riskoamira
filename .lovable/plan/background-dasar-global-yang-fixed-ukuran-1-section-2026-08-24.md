# Background Dasar Global yang Fixed (Ukuran 1 Section)

Satu latar utama dari Tema Undangan dipasang di belakang seluruh halaman, berukuran tepat satu section (1080 × 1920 kanvas) dan **tidak bergerak** saat halaman di-scroll. Semua section tetap bergulir normal di atasnya; bila section atau subsection dibuat transparan, latar dasar ini yang terlihat.

## Yang akan dikerjakan

1. Lapisan latar tetap (fixed)
   - Latar tema dipindah keluar dari aliran konten yang bergulir, dipasang sebagai lapisan tersendiri yang menempel ke layar (viewport), di lapisan paling bawah.
   - Ukuran lapisan = satu section penuh (1080 × 1920 logis), diskalakan dan diposisikan sama persis dengan kanvas section sehingga sejajar rapi di HP maupun desktop (area letterbox tetap gelap netral).
   - Overlay gelap tema (jika diatur) ikut menempel di lapisan yang sama.

2. Konten tetap bergulir
   - Section, subsection, dan field tidak berubah perilaku: tetap bergerak normal mengikuti scroll.
   - Section/subsection transparan akan menampilkan latar dasar tanpa "menempel" ikut bergulir, jadi terasa seperti jendela yang bergerak di atas latar diam.

3. Berlaku di undangan publik dan preview editor
   - Halaman undangan (termasuk saat cover masih tertutup) dan frame preview di editor memakai lapisan latar yang sama, supaya hasil edit sesuai dengan tampilan akhir.
   - Panel Tema di editor tetap seperti sekarang (unggah gambar, gradient, posisi, zoom, rotate, opasitas); tidak ada kontrol baru yang wajib diisi.

## Catatan teknis
- `src/components/invitation/CanvasStage.tsx`: menerima lapisan latar (prop `background`) yang dirender di luar wrapper ber-`transform`, dengan skala/lebar yang sama seperti kanvas, memakai posisi fixed relatif viewport.
- `src/components/invitation/InvitationRenderer.tsx`: hapus lapisan `position: fixed` latar tema yang sekarang berada di dalam elemen ber-transform (fixed di dalam transform ikut bergulir), ganti dengan mengekspor gaya latar untuk dipakai `CanvasStage`.
- `src/routes/index.tsx` dan `src/routes/admin.tsx`: kirim latar tema ke `CanvasStage` (mode viewport untuk publik, mode container untuk preview editor).
- Tanpa perubahan database, server function, atau aturan keamanan; konfigurasi tema yang sudah ada tetap terpakai.
- Verifikasi Playwright pada 390×844 dan 1440×900: latar tidak bergeser saat scroll, section tetap bergulir, tidak ada scroll horizontal.
