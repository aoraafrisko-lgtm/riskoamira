# Perbaikan Sistem Transparansi & Opacity + Pengecekan Fitur Field

Fokus: bikin "Transparan" dan "Opacity" benar-benar bekerja di section, subsection, dan field, lalu cek fitur-fitur di field library. Tanpa perubahan database.

## Masalah yang sudah dipastikan dari kode

1. Input Opacity (0-1) memakai `Number(e.target.value)` langsung, jadi saat mengetik "0." nilainya dibulatkan ke 0 dan titik desimalnya hilang — praktis tidak bisa mengisi 0.5/0.3.
2. Banyak field di `FieldRenderer.tsx` memakai fallback warna keras (mis. `style.bgColor ?? "#b08d57"`, `?? "currentColor"`, `background: "#fff"`) dan tidak melihat flag `transparent`, jadi switch Transparan tidak berpengaruh pada field seperti tombol, badge, kartu, divider, countdown, gift/rekening.
3. Wrapper field pada mode bebas (`FreeField`) dan alur (`FieldWrap`) tidak menerapkan `opacity` dari style field, hanya `hidden`, sehingga opacity per field terasa tidak konsisten.

Untuk level section/subsection, `styleToCss` sudah menghormati `transparent`; penyebab pastinya akan diverifikasi langsung di halaman (kemungkinan besar yang menutup adalah latar field/subsection di atasnya, bukan section-nya).

## Yang akan dikerjakan

1. Kontrol opacity yang stabil
   - Ganti input angka Opacity dengan slider 0–100% (plus angka persen) untuk section, subsection, dan field, jadi nilai desimal selalu valid dan langsung terlihat di preview.
   - Opacity latar (bg opacity) memakai kontrol serupa agar tidak ikut mempengaruhi teks.

2. Transparan konsisten di semua level
   - Flag `transparent` dihormati satu pintu: bila aktif, warna latar dan latar gambar bawaan field/subsection/section tidak digambar, sehingga background dasar tema terlihat.
   - Hapus fallback warna keras di field: jika pengguna belum pilih warna, pakai warna dari tema (bukan hex hardcode), dan jika transparan, benar-benar tanpa latar.
   - Switch Transparan tersedia di panel Design untuk field juga (sekarang efektif hanya di section/subsection).

3. Terapkan style field pada wrapper
   - `FieldWrap` dan `FreeField` menerapkan opacity/z-index/rotate dari style field, supaya hasil di editor sama dengan tampilan publik.

4. Pengecekan fitur field (hemat kredit)
   - Satu kali pengecekan otomatis pada satu halaman preview yang memuat kelompok field utama (teks/heading, gambar & galeri, countdown, RSVP, ucapan, gift/rekening, tombol, maps, musik/audio), mencatat error konsol dan field yang tidak merender.
   - Hasilnya dilaporkan sebagai daftar singkat: yang jalan, yang bermasalah, dan perbaikan cepat yang langsung disertakan bila kecil (mis. field kosong/крash render). Perbaikan besar ditawarkan dulu sebelum dikerjakan agar tidak membuang kredit.

## Catatan teknis
- `src/lib/builder/style.ts`: satu helper transparansi dipakai section/subsection/field; `styleToCss` tidak menulis `backgroundColor`/lapisan latar saat `transparent`.
- `src/components/invitation/FieldRenderer.tsx`: hilangkan fallback warna hardcode, hormati `transparent`.
- `src/components/invitation/InvitationRenderer.tsx`: terapkan opacity/rotate/zIndex style field di `FieldWrap` dan `FreeField`.
- `src/routes/admin.tsx`: ganti NumRow opacity dengan slider persen; tambah switch Transparan untuk field.
- Verifikasi: satu run Playwright 390×844 pada halaman publik dan preview editor (cek latar tema terlihat lewat section transparan, tidak ada error konsol).
