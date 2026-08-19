# Mobile-Only, Section Ukuran Pasti 1080 × 1920

Semua tampilan (HP maupun desktop) memakai satu kanvas mobile berukuran tetap 1080 × 1920 px per section. Di desktop, kanvas diskalakan agar pas tinggi layar dan sisi kiri/kanan jadi area kosong (letterbox) sehingga terlihat seperti layar penuh HP.

## Yang akan dikerjakan

1. Kanvas tunggal 1080 × 1920
   - Undangan publik dan preview editor selalu render pada lebar logis 1080 px, tinggi tiap section dipatok 1920 px.
   - Konten di dalam section tidak boleh menambah/mengurangi tinggi: overflow disembunyikan (dipotong), bukan memanjangkan section.
   - Wrapper luar memakai transform scale supaya kanvas selalu pas di layar apa pun; latar di luar kanvas gelap/netral.

2. Mobile-only
   - Hapus pilihan Desktop/Tablet di editor; hanya satu mode Mobile.
   - Breakpoint render dikunci ke `mobile`, deteksi lebar layar tidak lagi mengubah gaya (hanya mengubah faktor skala).

3. Editor menyesuaikan
   - Frame preview memakai rasio 1080:1920 dengan skala otomatis mengikuti tinggi panel; sudut membulat seperti HP.
   - Setting posisi bebas (X %, Y px, W %) dihitung terhadap kanvas 1080 × 1920, jadi koordinat konsisten di semua device.
   - Panel Struktur/Setting/Tamu tetap seperti sekarang (sheet bawah di layar kecil, 3 kolom di layar besar).
   - Kontrol "Canvas Height" per subsection dan override responsive per breakpoint disederhanakan/ dihapus karena tinggi section kini tetap.

4. Indikator batas
   - Di editor tampil penanda batas 1920 px dan peringatan halus bila konten terpotong, supaya mudah dirapikan.

## Catatan teknis
- Perubahan di `src/routes/index.tsx`, `src/routes/admin.tsx`, `src/components/invitation/InvitationRenderer.tsx`, `FieldRenderer.tsx`, `src/lib/builder/style.ts`, `types.ts`/`registry.ts` (default ukuran), dan `src/hooks/use-viewport-breakpoint.ts` (dipakai hanya untuk skala).
- Tanpa perubahan database, server function, atau aturan keamanan. Konfigurasi lama tetap terbaca; tinggi section lama diabaikan dan dipaksa 1920.
- Verifikasi Playwright pada 390×844 dan 1440×900: memastikan kanvas terpusat, tinggi section tetap, dan tidak ada scroll horizontal.
