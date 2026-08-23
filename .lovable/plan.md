# Perbaikan Kolom Galeri & Template Pesan WhatsApp

## 1. Kolom (grid) hanya bisa 1 dan 3

Penyebab yang sudah dipastikan: di `FieldRenderer.tsx` jumlah kolom dibatasi
`Math.min(kolom, 2)` saat breakpoint mobile. Karena seluruh kanvas sekarang
dipaksa mobile (1080×1920), nilai 2, 3, 4, 5, 6 semuanya dirender jadi 2 kolom —
jadi terasa "cuma 1 dan 3 yang berubah".

Perbaikan:
- Hapus pembatas mobile itu; kolom dirender sesuai angka yang diatur (kanvas
  lebar 1080 px jadi 4–6 kolom tetap layak).
- Batasi nilai lewat min/max dari registry (grid 1–6, masonry/polaroid 1–5)
  supaya input di panel Behavior tidak bisa keluar rentang.
- Terapkan ke ketiga mode render yang memakai kolom: grid, masonry, polaroid.

## 2. Pesan WhatsApp bisa diedit

Saat ini teks WA di-hardcode satu baris di halaman Tamu.

Yang dibuat:
- Editor template pesan di halaman Tamu (tombol "Template Pesan" → panel/drawer),
  berisi textarea multi-baris + daftar placeholder yang bisa disisipkan:
  `{nama}`, `{sapaan}`, `{kategori}`, `{link}`, `{token}`.
- Pratinjau langsung memakai tamu pertama supaya kelihatan hasil akhirnya.
- Template disimpan di penyimpanan lokal browser (localStorage) dengan tombol
  "Kembalikan default"; tidak perlu perubahan database.
- Tombol WhatsApp per tamu (dan aksi massal, bila dipakai) memakai template ini
  setelah placeholder diganti.

## Catatan teknis

- Berkas yang disentuh: `src/components/invitation/FieldRenderer.tsx` (kolom),
  `src/lib/builder/registry.ts` bila perlu penyelarasan min/max,
  `src/routes/admin.tsx` (meneruskan min/max ke input angka),
  `src/components/admin/GuestsManager.tsx` (editor template + pemakaiannya).
- Tidak ada perubahan skema database, server function, maupun struktur config undangan.
