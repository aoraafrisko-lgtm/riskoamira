# Perbaikan Latar Dasar yang Tidak Muncul (Section Bawah Jadi Hitam)

Saat digulir ke section bawah (misal section 5), latar dasar tema hilang dan yang terlihat hanya warna gelap halaman. Penyebabnya sudah dikonfirmasi dari pemeriksaan halaman langsung: lapisan latar dipasang `sticky`, tetapi elemen `main` diberi `overflow: auto` sehingga dianggap wadah scroll sendiri. Karena `main` sendiri tidak pernah bergulir (halaman yang bergulir), `sticky` tidak pernah "menempel" — latar ikut tergulir habis setelah satu section, lalu yang tersisa hanya warna dasar gelap `#141210`.

## Yang akan dikerjakan

1. Latar dasar benar-benar diam
   - Lapisan latar tema dipasang `position: fixed` di belakang seluruh halaman (bukan `sticky` lagi), berukuran tepat satu section (1080 × 1920 logis) dan diskalakan/dipusatkan sama seperti kanvas.
   - Lapisan ini berada di luar wrapper ber-`transform` supaya `fixed` benar-benar mengacu ke layar, dan dipasang di lapisan paling bawah (`z-index` di bawah konten).

2. Halaman tidak lagi membuat wadah scroll palsu
   - `overflow: auto` pada `main` dihapus saat undangan sudah terbuka (hanya dipakai untuk mengunci scroll saat cover masih tertutup), agar tidak mematikan perilaku latar tetap.

3. Area di luar kanvas
   - Sisi kiri/kanan (letterbox) tetap gelap netral, tetapi area section yang transparan sekarang menampilkan latar dasar tema di semua section, termasuk section paling bawah.

4. Berlaku sama di preview editor
   - Mode `container` di editor memakai latar diam relatif frame preview (absolute di dalam frame), sehingga hasil editor tetap sesuai dengan tampilan publik.

## Catatan teknis
- `src/components/invitation/CanvasStage.tsx`: ganti lapisan `sticky` menjadi `fixed` (mode viewport) / `absolute` di dalam holder ber-`position: relative` (mode container); lapisan tetap di luar elemen ber-`transform`.
- `src/routes/index.tsx`: hapus `overflow: "auto"` pada `main` ketika tidak terkunci; `overflow: hidden` + `height: 100dvh` hanya saat cover terkunci.
- Tanpa perubahan database, server function, atau aturan keamanan.
- Verifikasi Playwright pada 390×844 dan 1440×900: gulir sampai section terakhir dan pastikan latar dasar tetap terlihat, tidak ada scroll horizontal.
