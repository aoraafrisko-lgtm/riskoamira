# Mobile-First Undangan + Editor

Fokus: hasil undangan harus tampil bagus di HP, dan editor nyaman dipakai di layar kecil.

## Masalah saat ini
- Halaman undangan publik (`src/routes/index.tsx`) selalu merender dengan breakpoint `desktop`, jadi semua override gaya/posisi khusus mobile tidak pernah dipakai walau dibuka dari HP.
- Preview fullscreen di admin juga dipaksa `desktop`, sehingga tidak mencerminkan tampilan HP.
- Editor default membuka breakpoint `desktop`; di HP tiga panel (Struktur, Preview, Settings) menumpuk vertikal dengan tinggi tetap (240/300/320px) sehingga area preview sempit dan banyak scroll bersarang.

## Yang akan dikerjakan

1. Breakpoint otomatis di undangan publik
   - Deteksi lebar layar (mobile < 768, tablet < 1024, sisanya desktop) dan render sesuai, ikut berubah saat rotate/resize.
   - Aman untuk SSR: render awal mobile, disesuaikan setelah hydrate.

2. Editor default mobile
   - Breakpoint awal editor = `mobile`, lebar frame preview mengikuti (±390px) dengan sudut membulat seperti HP.
   - Preview fullscreen memakai breakpoint yang sedang dipilih, bukan desktop.

3. Tata letak editor untuk layar kecil
   - Di HP: preview jadi area utama (tinggi penuh), Struktur/Settings/Tamu pindah ke panel bawah yang bisa dibuka-tutup (sheet/drawer) lewat bar tombol tetap di bawah.
   - Header dirapikan: tombol Undo/Redo/Save/Publish jadi ikon compact, status simpan tetap terlihat, pemilih Desktop/Tablet/Mobile jadi segmented kecil.
   - Di layar lg ke atas tetap 3 kolom seperti sekarang.

4. Rapikan render mobile
   - Padding/section, ukuran heading, gap grid, dan galeri diberi skala mobile agar tidak terlalu besar/menempel tepi.
   - Field mode "bebas" tetap bisa diposisikan per breakpoint; toolbar field dan handle drag diperbesar agar nyaman disentuh (target ≥ 36px) dan tidak keluar layar.

## Catatan teknis
- Perubahan terbatas pada `src/routes/index.tsx`, `src/routes/admin.tsx`, `src/components/invitation/InvitationRenderer.tsx`, `FieldRenderer.tsx`, dan skala default di `src/lib/builder/style.ts`/`registry.ts`.
- Tidak ada perubahan skema database, server function, atau aturan keamanan.
- Verifikasi dengan Playwright pada viewport 390x844: cek undangan publik dan editor (buka/tutup panel, drag field).
