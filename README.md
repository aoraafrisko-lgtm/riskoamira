# Wedding Weaver

Buat sebuah Interactive Visual Wedding Invitation Builder untuk membuat dan mengedit SATU website undangan pernikahan.

KONSEP UTAMA

Website hanya memiliki satu undangan.

/ → langsung menampilkan undangan publik.

/admin → halaman login dan visual editor.

Tidak ada sistem multi-undangan.

Tidak ada halaman daftar undangan.

Admin harus dapat membangun undangan secara visual dan interaktif, tanpa harus menulis kode.

Konsep editor:

Section → Subsection → Field

Semua dapat dibuat, diubah, dipindahkan, diduplikasi, disembunyikan, dan dihapus kapan saja.

1. ADMIN LOGIN

URL:

/admin

Tampilkan halaman login yang sederhana dan elegan.

Input:

Kode Admin

[____________]

Button:

Masuk

Gunakan kode awal:

123456

Setelah berhasil login → langsung masuk ke Visual Editor.

Jangan tampilkan editor sebelum login.

2. VISUAL EDITOR

Editor harus terasa seperti website builder, bukan halaman form biasa.

Gunakan layout:

┌───────────────────────────────────────────────────────────┐
│ HEADER                                                     │
│ Logo / Nama Undangan     Preview     Save     Publish     │
├───────────────┬───────────────────────────┬───────────────┤
│               │                           │               │
│   STRUCTURE   │       LIVE PREVIEW        │   SETTINGS    │
│               │                           │               │
│ Section       │                           │ Selected      │
│  └ Subsection │       UNDANGAN            │ element       │
│     └ Field   │                           │ settings      │
│               │                           │               │
└───────────────┴───────────────────────────┴───────────────┘


Layout harus responsif dan nyaman digunakan.

3. PANEL STRUCTURE

Panel kiri menampilkan struktur undangan secara realtime.

Contoh:

UNDANGAN

＋ Tambah Section

▼ Section 1
   ＋ Tambah Subsection

   ▼ Subsection 1
      ＋ Tambah Field

      Heading
      Image
      Text

   ▼ Subsection 2
      Image Slider
      Text

▼ Section 2
   ...


Setiap item harus memiliki kontrol:

Drag

Edit

Duplicate

Delete

Hide/Show

Jangan menggunakan navigasi halaman untuk mengedit struktur.

4. TAMBAH SECTION

Ketika admin klik:

＋ Tambah Section

jangan langsung membuat Section tanpa interaksi.

Tampilkan pilihan:

Tambah Section

[ Blank Section ]

[ Section dengan Background ]

[ Section Full Screen ]

[ Section Split ]

[ Section Gallery ]

[ Custom ]


Namun Blank Section harus menjadi pilihan default.

Setelah Section dibuat, langsung tampil di editor dan preview.

5. TAMBAH SUBSECTION

Ketika admin klik:

＋ Tambah Subsection

tampilkan pilihan:

Blank

Text

Image

Image + Text

Gallery

Event

Couple

Custom

Setelah dipilih, Subsection langsung ditambahkan ke Section yang aktif.

6. TAMBAH FIELD

Ini adalah fitur utama.

Ketika admin klik:

＋ Tambah Field

buka Field Library / Modal.

Jangan menampilkan daftar panjang tanpa kategori.

Gunakan kategori dan search.

Contoh:

┌─────────────────────────────────────┐
│ Tambah Field                        │
│                                     │
│ 🔍 Cari field...                    │
│                                     │
│ TEXT                                │
│ [Heading] [Text] [Rich Text]        │
│ [Quote] [Typing] [Scrolling]        │
│                                     │
│ IMAGE                               │
│ [Image] [Slider] [Carousel]         │
│ [Gallery] [Masonry] [Polaroid]      │
│                                     │
│ WEDDING                             │
│ [Couple] [Event] [Countdown]        │
│ [Love Story] [Location]             │
│                                     │
│ INTERACTIVE                         │
│ [Button] [RSVP] [WhatsApp]          │
│                                     │
│ ...dan seterusnya                   │
└─────────────────────────────────────┘


Field Library harus memiliki:

Search

Kategori

Icon

Nama

Deskripsi singkat

Preview jika memungkinkan

Klik field → field langsung ditambahkan.

7. FIELD LIBRARY SANGAT LENGKAP

Sediakan banyak field sejak awal.

TEXT

Heading

Subheading

Paragraph

Rich Text

Quote

Caption

Label

Typing Text

Scrolling Text

Marquee

Text Reveal

Character Reveal

Word Reveal

Highlight Text

IMAGE

Single Image

Image Slider

Horizontal Slider

Swipe Gallery

Auto Carousel

Fade Carousel

Coverflow

Ken Burns

Zoom Image

Parallax Image

Before/After

Photo Grid

Masonry

Polaroid

Stack

Scattered Photos

Circular Gallery

Image Cards

Background Image

Lightbox

Fullscreen Gallery

Vertical Gallery

Horizontal Marquee

MEDIA

Video

YouTube

Vimeo

Background Video

Audio

Music Player

WEDDING

Couple Profile

Groom

Bride

Wedding Date

Countdown

Event

Akad

Resepsi

Love Story

Timeline

Quote

Location

Google Maps

Calendar

INTERACTIVE

Button

WhatsApp

Maps Button

Calendar Button

Social Media

Instagram

TikTok

Facebook

Custom Link

Scroll to Section

Modal

Copy Text

GUEST

Guest Name

Guest Greeting

Guest Category

RSVP

Attendance

Guest Wishes

GIFT

Bank Account

E-Wallet

QR Code

Gift Information

Copy Account

DECORATION

Divider

Spacer

Icon

Shape

Circle

Line

Ornament

Decorative Image

Floating Element

Confetti

Sparkle

Particle

CUSTOM

Custom HTML

Embed

Custom Variable

8. FIELD SETTINGS HARUS DINAMIS

Ketika admin memilih Field, panel kanan berubah sesuai jenis Field.

Contoh memilih Heading:

FIELD: Heading

Content
[ Pernikahan Kami ]

Typography
Font
Size
Weight
Color
Alignment

Spacing
Margin
Padding

Animation
Effect
Duration
Delay

Responsive
Desktop
Tablet
Mobile


Jika memilih Image Slider, panel otomatis berubah:

FIELD: Image Slider

CONTENT
+ Tambah Foto

[ Foto 1 ]
[ Foto 2 ]
[ Foto 3 ]

BEHAVIOR
Autoplay     ON
Loop         ON
Swipe        ON
Navigation   ON
Speed        3s
Transition   Fade

DESIGN
Height
Radius
Gap
Shadow

ANIMATION
Entrance
Scroll Effect

RESPONSIVE
Desktop
Tablet
Mobile


Jangan menampilkan setting yang tidak relevan dengan Field tersebut.

9. EDIT LANGSUNG DI PREVIEW

Ini sangat penting.

Admin harus dapat mengklik elemen langsung di Live Preview.

Contoh:

Admin klik teks:

"Save the Date"

Maka teks tersebut menjadi selected.

Tampilkan:

outline

toolbar kecil

panel settings

Admin dapat langsung mengedit isinya.

Jika memungkinkan, dukung:

double click → edit text langsung di preview.

Perubahan langsung terlihat.

10. TOOLBAR ELEMENT

Ketika Section/Subsection/Field dipilih di preview, tampilkan toolbar kecil:

[Edit] [Duplicate] [Move] [Hide] [Delete]


Untuk Field tertentu:

[Edit] [Style] [Animate] [Duplicate] [Delete]


Jangan membuat admin harus selalu mencari tombol Edit di sidebar.

11. DRAG & DROP INTERAKTIF

Admin dapat drag & drop:

Section

Subsection

Field

Foto dalam gallery

Saat sedang drag, tampilkan indikator lokasi penempatan.

Setelah dilepas:

urutan langsung berubah

preview langsung berubah

struktur kiri langsung berubah

12. ADD FIELD DARI PREVIEW

Di area kosong Subsection tampilkan:

＋ Tambah Field

Klik tombol tersebut → Field Library muncul.

Jadi admin tidak hanya dapat menambahkan Field melalui sidebar.

13. EMPTY STATE

Dashboard pertama kali:

Belum ada Section

Mulai buat undangan Anda.

[ ＋ Tambah Section ]


Setelah Section dibuat:

Section 1

[ ＋ Tambah Subsection ]


Setelah Subsection dibuat:

Subsection 1

[ ＋ Tambah Field ]


Jadikan proses ini terasa seperti building blocks.

14. DUPLICATE

Semua level harus bisa diduplikasi.

Section:

Duplicate Section

Subsection:

Duplicate Subsection

Field:

Duplicate Field

Foto:

Duplicate Photo

Hasil duplikasi harus menjadi item baru yang independen.

15. DELETE

Saat delete, tampilkan konfirmasi hanya jika diperlukan.

Contoh:

Hapus Field?

Field ini akan dihapus dari Subsection.

[ Batal ] [ Hapus ]

Jangan membuat admin kehilangan data secara tidak sengaja.

16. UNDO / REDO

Tambahkan:

Undo
Redo

Minimal untuk perubahan editor seperti:

tambah

hapus

edit

pindah

duplicate

perubahan konfigurasi

Gunakan keyboard shortcut:

Ctrl + Z

Ctrl + Shift + Z

jika memungkinkan.

17. AUTOSAVE

Perubahan editor harus disimpan otomatis.

Tampilkan status:

✓ Tersimpan

atau:

Menyimpan...

atau:

Perubahan belum tersimpan

Jangan membuat admin takut kehilangan perubahan.

Tambahkan tombol manual:

Save

sebagai tambahan.

18. LIVE PREVIEW

Preview harus benar-benar menampilkan hasil website.

Mode:

Desktop | Tablet | Mobile

Tambahkan tombol:

Preview Fullscreen

agar admin dapat melihat undangan seperti pengunjung.

19. RESPONSIVE SETTINGS

Setiap Field dapat memiliki pengaturan berbeda:

Desktop
Tablet
Mobile

Contoh:

Desktop:

3 gambar

Mobile:

1 gambar

Admin dapat menentukan nilai masing-masing jika diperlukan.

20. DESIGN SETTINGS

Setiap Section, Subsection, dan Field dapat diatur secara independen.

Sediakan:

Background color

Gradient

Background image

Text color

Font

Font size

Weight

Alignment

Width

Height

Padding

Margin

Border

Radius

Shadow

Opacity

Rotation

Transform

Z-index

Animation

Gunakan color picker dan kontrol visual.

21. ANIMATION BUILDER

Jangan hanya menyediakan satu animasi.

Admin dapat memilih:

Fade

Slide

Zoom

Scale

Rotate

Bounce

Float

Pulse

Reveal

Parallax

Typing

Marquee

Ken Burns

Scroll Reveal

Pengaturan:

Trigger

Duration

Delay

Speed

Direction

Repeat

Loop

Once

22. IMAGE SYSTEM

Setiap Image Field mendukung:

Upload

dan:

Use Image URL

Contoh:

[ Upload ]
atau
[ Paste Image URL ]

https://example.com/image.jpg


Untuk gallery:

+ Tambah Foto

Foto 1 → Upload
Foto 2 → URL
Foto 3 → Upload
Foto 4 → URL


Foto dapat:

Reorder

Delete

Replace

Duplicate

23. GUEST PERSONALIZATION

Admin memiliki menu:

Tamu

Admin dapat:

tambah tamu

edit

hapus

cari

filter

import CSV

export CSV

Setiap tamu mempunyai unique token.

Contoh:

/?guest=abc123

Saat dibuka:

Kepada Yth.

Bapak Andi

di tempat


Guest Name harus berasal dari database berdasarkan token.

24. RSVP

Tamu dapat:

Konfirmasi hadir

Tidak hadir

Jumlah orang

Ucapan

Admin dapat melihat hasil RSVP di dashboard.

25. STORAGE

Gunakan storage untuk file upload.

Minimal:

Image

Video

Audio

Tetapi URL eksternal tetap diperbolehkan.

26. DATABASE

Simpan struktur:

Invitation
  Sections
    Subsections
      Fields
        Content
        Style
        Behavior
        Animation
        Responsive


Simpan juga:

Guest

RSVP

Media

Settings

Jangan hardcode isi undangan ke source code.

27. DATA-DRIVEN RENDERER

Public invitation harus dirender berdasarkan konfigurasi editor.

Konsep:

Admin Editor
      ↓
Configuration
      ↓
Renderer
      ↓
Public Invitation


Jangan membuat / sebagai halaman statis yang harus diubah manual oleh developer.

28. FIELD REGISTRY

Buat sistem Field Registry.

Setiap Field memiliki:

ID

Type

Name

Category

Icon

Description

Default configuration

Content schema

Style schema

Behavior schema

Responsive schema

Renderer

Tujuannya agar nanti Field baru dapat ditambahkan tanpa merusak Field lama.

29. CUSTOM FIELD

Siapkan fondasi untuk Custom Field.

Nantinya admin/developer dapat membuat Field baru dengan:

Content

Style

Behavior

Animation

Responsive

Tidak perlu membuat ulang editor setiap kali jenis Field baru ditambahkan.

30. PUBLIC WEBSITE

/

langsung menampilkan undangan.

Tidak boleh ada:

Login

Dashboard

Sidebar admin

Tombol edit

Halaman publik harus bersih dan profesional.

31. ADMIN HARUS TERASA INTERAKTIF

Prioritaskan pengalaman seperti visual builder:

Klik → Pilih → Edit → Lihat hasil langsung.

Bukan:

Klik → pindah halaman → isi form → submit → kembali.

Usahakan sebanyak mungkin pengaturan dapat dilakukan tanpa meninggalkan editor.

32. UI/UX

Gunakan desain admin yang modern, bersih, ringan, dan mudah dipahami.

Gunakan:

Sidebar

Tabs

Accordion

Modal

Dropdown

Color picker

Slider

Toggle

Input

Drag handle

Tooltip

Search

Field categories

Hindari panel yang terlalu padat.

Kelompokkan pengaturan menjadi:

Content
Design
Layout
Behavior
Animation
Responsive

33. INTEGRASI AWAL

Gunakan hanya integrasi yang benar-benar diperlukan:

Database

Storage

Admin authentication

Google Maps/link maps

WhatsApp link

QR Code

CSV import/export

Guest personalization

RSVP

Jangan menambahkan integrasi pembayaran atau layanan eksternal yang belum diperlukan.

34. ARSITEKTUR UNTUK PENGEMBANGAN

Project harus mudah dikembangkan melalui prompt berikutnya.

Jangan merusak struktur lama ketika menambahkan fitur.

Jangan hardcode:

jumlah Section

jumlah Subsection

jumlah Field

jumlah foto

tipe layout

tipe animasi

Semua harus extensible.

35. PRIORITAS IMPLEMENTASI

Bangun dalam urutan:

Tahap 1

Admin login + Visual Editor + Empty State.

Tahap 2

Section + Subsection + Field system.

Tahap 3

Field Library lengkap.

Tahap 4

Live Preview + Direct Editing.

Tahap 5

Drag & Drop + Duplicate + Delete + Undo/Redo + Autosave.

Tahap 6

Design + Animation + Responsive system.

Tahap 7

Storage + Image Upload/URL.

Tahap 8

Guest personalization + RSVP.

Tahap 9

Polishing UI/UX.

Jika satu tahap belum stabil, prioritaskan memperbaikinya sebelum menambahkan fitur berikutnya.

HASIL YANG DIINGINKAN

Saya tidak ingin sekadar website undangan statis.

Saya ingin sebuah:

VISUAL MODULAR WEDDING INVITATION BUILDER

yang memungkinkan admin membuat undangan dari keadaan kosong dengan cara:

Tambah Section
→ Tambah Subsection
→ Tambah Field
→ Klik Field
→ Atur Content
→ Atur Design
→ Atur Behavior
→ Atur Animation
→ Lihat perubahan secara langsung di Preview

Semua perubahan harus terasa langsung, visual, interaktif, dan mudah digunakan.

Bangun fondasi yang kuat dan extensible agar pada tahap berikutnya saya dapat terus menambahkan jenis Field, efek, layout, animasi, dan fitur baru tanpa perlu membuat ulang sistem.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://testerar4.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dce8dc80-49fe-4dc3-a1f2-5b8b7af1e19b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
