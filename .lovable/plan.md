# Perbaikan Tombol "Rapikan" & Cover Section 1 yang Editable

## 1. Tombol "Rapikan" tidak berfungsi

Penyebab: kalau subsection-nya berlayout **Free**, semua field otomatis diperlakukan bebas — flag per-field (`Bebas`/`Rapikan`) diabaikan, jadi menekan "Rapikan" pada gambar tidak mengubah apa pun.

Perbaikan:
- Di layout Free, field yang ditandai "Rapikan" (`free: false`) dikembalikan ke alur normal (mengalir vertikal, ikut padding subsection), sementara field lain tetap bisa digeser bebas.
- Tombol "Rapikan" juga membersihkan sisa posisi drag supaya field benar-benar kembali rapi (tidak menempel di koordinat lama).
- Label tombol dibuat jelas mengikuti kondisi field: "✥ Bebas" bila sedang rapi, "🔒 Rapikan" bila sedang bebas.

## 2. Cover "Buka Undangan" pindah ke Section 1 dan bisa diedit

Sekarang tombolnya berupa overlay yang tidak bisa diedit. Yang akan dibuat:

- Field baru **"Buka Undangan"** di kategori Interactive: label, teks kecil di atasnya, sapaan `Kepada: <nama tamu>`, warna, radius, dan efek shimmer bisa diatur dari panel Setting seperti field lain. Bisa diletakkan bebas (drag) di Section 1.
- Section 1 = cover. Sebelum dibuka: hanya Section 1 terlihat, scroll dikunci.
- Saat tombol diklik: Section 1 fade + zoom keluar lalu **disembunyikan sepenuhnya** (tidak lagi bisa di-scroll balik), lalu tampilan langsung berpindah ke Section 2.
- Menu navigasi section tetap hanya berisi Section 2 ke atas.
- Di editor, Section 1 tetap tampil normal dan tombolnya tidak mengunci apa pun (hanya pratinjau) sehingga bisa diedit bebas.
- Overlay `CoverGate` lama dihapus; kalau belum ada field "Buka Undangan" di Section 1, tombol bawaan sederhana tetap muncul sebagai cadangan agar undangan lama tetap bisa dibuka.

## Catatan teknis

- `src/components/invitation/InvitationRenderer.tsx`: pisahkan flow vs float field di `FreeCanvas`; teruskan callback `onOpenInvitation` lewat render context.
- `src/lib/builder/registry.ts` + `FieldRenderer.tsx`: tipe field `open-invitation` (render `open-button`) dengan setting content/design.
- `src/routes/index.tsx`: state `opened`/`closing`, sembunyikan section cover setelah animasi, scroll ke section berikutnya; hapus pemakaian `CoverGate.tsx`.
- `src/routes/admin.tsx`: hanya penyesuaian toggle Bebas/Rapikan.
- Tanpa perubahan database, server function, atau aturan keamanan; kanvas tetap 1080 × 1920.
