# Perbaikan Urutan Lapisan: Latar Dasar Harus di Belakang Section

Setelah latar dasar dipindah ke lapisan tetap (fixed) di `body`, latar itu justru menutupi section. Pemeriksaan halaman langsung mengonfirmasi penyebabnya: di `body` sekarang ada dua anak — `main` (posisi `static`) dan lapisan latar (posisi `fixed`, `z-index: 0`). Elemen berposisi dengan `z-index: 0` selalu dilukis di atas isi elemen `static`, jadi latar naik ke depan dan section tertutup.

## Yang akan dikerjakan

1. Latar dasar dikembalikan ke lapisan paling belakang
   - Lapisan latar tetap `fixed` seukuran layar, tapi diberi `z-index` negatif sehingga selalu di belakang seluruh konten.
   - Karena lapisan berada di belakang, warna dasar halaman tidak boleh lagi menutupinya: warna gelap letterbox dipindah ke latar halaman (root/`body`) alih-alih dipasang solid pada `main`.

2. Konten section dipastikan di depan
   - Wrapper kanvas diberi konteks tumpukan sendiri dengan `z-index` positif eksplisit, supaya section, subsection, dan field selalu berada di atas latar dasar.
   - Section yang transparan tetap memperlihatkan latar dasar; section yang punya warna/gambar sendiri tetap menutupinya seperti biasa.

3. Perilaku scroll tidak berubah
   - Latar tetap diam saat halaman digulir dan tetap mengisi penuh tinggi layar (skala cover), sama untuk undangan publik maupun frame preview editor.

## Catatan teknis
- `src/components/invitation/CanvasStage.tsx`: lapisan latar memakai `zIndex: -1` (mode viewport, diportal ke `body`) dan `zIndex: 0` di dalam holder untuk mode container; wrapper konten memakai `position: relative` + `zIndex: 1` dan `isolation: isolate`.
- `src/routes/index.tsx`: `main` tidak lagi memakai `background` solid; warna letterbox gelap dipasang di root halaman (mis. lewat kelas/atribut gaya pada elemen pembungkus paling luar atau `body` di `src/styles.css`).
- Tanpa perubahan database, server function, atau aturan keamanan.
- Verifikasi Playwright pada 390×844 dan 1440×900: section terlihat, latar dasar tampak di area transparan dan tidak bergeser saat scroll, tanpa scroll horizontal.
