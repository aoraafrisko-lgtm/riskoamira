# Cover Opening, Navigasi Section & Manajemen Tamu

## 1. Cover + tombol "Buka Undangan"

- Section pertama diperlakukan sebagai cover pada tampilan publik.
- Sebelum dibuka: hanya cover terlihat, scroll dikunci, ada sapaan `Kepada: <nama tamu>` bila ada `?guest=` token, dan tombol **Buka Undangan** memakai warna aksen tema dengan shimmer/pulse halus.
- Saat ditekan: cover zoom-in + fade keluar, konten undangan fade/slide masuk, lalu otomatis scroll ke Section 1 (section setelah cover). Semua animasi CSS/transform, ukuran kanvas 1080×1920 tetap.

## 2. Navigasi antar section

- Tombol bulat mengapung di kanan bawah kanvas, muncul setelah undangan dibuka.
- Diketuk → daftar nama section (`section.name`), melewati section `hidden` dan cover.
- Pilih section → scroll halus ke section itu; section aktif ditandai (deteksi via IntersectionObserver).

## 3. Menu Tamu jadi halaman sendiri (lebih interaktif)

Memisahkan admin jadi dua tampilan penuh: **Editor** dan **Tamu**, bukan tab sempit seperti sekarang.

- Halaman Tamu: header ringkas dengan statistik (total tamu, sudah RSVP, hadir, tidak hadir, total headcount).
- Tabel tamu interaktif: pencarian, filter kategori, urut (nama/terbaru), pilih banyak (checkbox) untuk hapus massal, dan status RSVP per tamu.
- Tiap tamu punya aksi cepat: salin link undangan, buka pratinjau link, bagikan via WhatsApp (memakai nomor telepon bila ada), edit, hapus.
- **Edit tamu punya tampilan sendiri** (panel/drawer terpisah, bukan inline): nama, kategori, nomor telepon, sapaan khusus, plus link + token tamu.
- Tab RSVP & Ucapan di halaman yang sama, dengan filter hadir/tidak hadir.
- Di layar HP semuanya tetap enak dipakai: daftar berbentuk kartu, tombol aksi besar, drawer bawah untuk edit.

## 4. Import & Export tamu

- **Import**: dialog khusus dengan area upload (klik atau drag & drop) untuk file CSV/teks, contoh format yang bisa diunduh sebagai template, pratinjau baris hasil parsing sebelum disimpan, hitung baris valid/dilewati, lalu konfirmasi impor.
- Format didukung: `nama, kategori, telepon, sapaan` — pemisah koma atau titik koma, baris header otomatis dilewati (sudah sesuai perilaku impor saat ini).
- **Export**: unduh CSV lengkap (nama, kategori, telepon, sapaan, token, link undangan) untuk seluruh tamu atau hanya hasil filter/pilihan; tambahan tombol "Salin semua link".

## Catatan teknis

- Komponen baru: `src/components/invitation/CoverGate.tsx`, `src/components/invitation/SectionNav.tsx`, dan `src/components/admin/GuestsManager.tsx` (+ dialog import & drawer edit) untuk memecah `admin.tsx` yang sudah panjang.
- Scroll section memakai `data-section-id` yang sudah dirender `InvitationRenderer`.
- Server function yang ada dipakai apa adanya: `listGuests`, `saveGuest`, `deleteGuest`, `importGuestsCsv`, `listRsvps`. Parsing pratinjau CSV dilakukan di sisi klien sebelum dikirim; hapus massal memanggil `deleteGuest` per baris. Export dibuat di klien dari data yang sudah dimuat.
- Tidak ada perubahan skema database dan tidak ada perubahan struktur config undangan.
