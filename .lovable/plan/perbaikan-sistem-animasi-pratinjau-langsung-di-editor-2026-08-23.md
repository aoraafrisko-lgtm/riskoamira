# Perbaikan Sistem Animasi + Pratinjau Langsung di Editor

## Masalah yang ditemukan

1. **Beberapa efek memang tidak jalan.** Efek `float`, `pulse`, `kenburns`, `bounce` memanggil keyframes CSS bernama `inv-float`, `inv-pulse`, dst — tapi keyframes itu tidak ada sama sekali di stylesheet, jadi tidak terjadi apa pun. `bounce` dan `parallax` juga tidak ditangani di logika animasi.
2. **Trigger "scroll" hanya sekali.** Elemen ditandai terlihat saat pertama masuk layar dan tidak pernah direset, jadi saat di-scroll keluar lalu masuk lagi animasinya tidak terulang.
3. **Tidak ada pratinjau di editor.** Di editor semua elemen dianggap sudah terlihat, jadi setelah mengubah efek/durasi/delay tidak kelihatan hasilnya.

## Yang akan dikerjakan

### 1. Lengkapi semua efek
- Tambahkan keyframes `inv-float`, `inv-pulse`, `inv-kenburns`, `inv-bounce`, `inv-shimmer` di stylesheet global.
- Tangani `bounce` (masuk memantul) dan `parallax` (geser halus mengikuti scroll) di logika animasi, sehingga tiap pilihan pada dropdown Effect benar-benar punya hasil visual.
- Rapikan pemetaan efek supaya tidak ada opsi "kosong" di daftar.

### 2. Trigger scroll bisa berulang
- Reveal akan mereset ketika elemen keluar dari layar, sehingga animasi berjalan lagi setiap kali di-scroll kembali — berlaku untuk field, subsection, dan section.
- Kalau Repeat = "once", animasi tetap hanya sekali (tidak reset). Kalau Repeat = "loop" pada efek masuk, animasi diulang setiap kali elemen kembali terlihat.

### 3. Pratinjau langsung setelah mengedit animasi
- Setiap kali nilai di tab **Anim** diubah (effect, trigger, direction, duration, delay, repeat), elemen yang sedang dipilih otomatis memutar ulang animasinya di kanvas editor.
- Tambahkan tombol **▶ Putar Animasi** di tab Anim untuk memutar ulang kapan pun, plus opsi memutar seluruh section.
- Animasi di editor hanya dijalankan saat pemutaran ini; di luar itu elemen tetap tampil normal supaya tidak mengganggu proses edit/drag.

## Catatan teknis

- `src/styles.css`: tambah keyframes `inv-*` yang hilang.
- `src/lib/builder/style.ts`: `animationCss` menangani `bounce`/`parallax`, dan mendukung penanda "replay".
- `src/lib/builder/use-reveal.ts`: dukung reset saat keluar viewport (opsi `once`) dan sebuah nonce untuk memicu ulang animasi.
- `src/components/invitation/FieldRenderer.tsx` + `InvitationRenderer.tsx`: teruskan nonce pratinjau (lewat render context) ke elemen terpilih.
- `src/routes/admin.tsx`: naikkan nonce saat nilai animasi berubah, tambah tombol putar ulang di tab Anim.
- Tanpa perubahan database, server function, atau aturan keamanan.
