import type { AnimationConfig, ContentValue, FieldNode, StyleConfig } from "./types";
import { uid } from "./types";

export type ControlType =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "select"
  | "toggle"
  | "photos"
  | "list"
  | "image";

export interface ControlDef {
  key: string;
  label: string;
  type: ControlType;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

/** Renderer kinds. Adding a new kind only requires a renderer + registry entries. */
export type RenderKind =
  | "heading"
  | "text"
  | "richtext"
  | "quote"
  | "typing"
  | "marquee"
  | "reveal"
  | "image"
  | "slider"
  | "carousel"
  | "grid"
  | "masonry"
  | "polaroid"
  | "stack"
  | "circular"
  | "beforeafter"
  | "background"
  | "video"
  | "embedvideo"
  | "audio"
  | "couple"
  | "person"
  | "date"
  | "countdown"
  | "event"
  | "story"
  | "timeline"
  | "location"
  | "map"
  | "button"
  | "social"
  | "guestname"
  | "rsvp"
  | "wishes"
  | "bank"
  | "qrcode"
  | "divider"
  | "spacer"
  | "icon"
  | "shape"
  | "particles"
  | "open-button"
  | "html";

export interface FieldDefinition {
  type: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  render: RenderKind;
  controls: ControlDef[];
  defaultContent: Record<string, ContentValue>;
  defaultStyle?: StyleConfig;
  defaultBehavior?: Record<string, ContentValue>;
  defaultAnimation?: AnimationConfig;
}

const photo = (url: string) => ({ id: uid("ph"), url });
const DEMO = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
];

const CONTROLS: Record<RenderKind, ControlDef[]> = {
  heading: [{ key: "text", label: "Teks", type: "text" }],
  text: [{ key: "text", label: "Teks", type: "textarea" }],
  richtext: [{ key: "html", label: "Rich Text (HTML sederhana)", type: "textarea" }],
  quote: [
    { key: "text", label: "Kutipan", type: "textarea" },
    { key: "source", label: "Sumber", type: "text" },
  ],
  typing: [
    { key: "text", label: "Teks", type: "text" },
    { key: "speed", label: "Kecepatan (ms/char)", type: "number", min: 20, max: 500 },
  ],
  marquee: [
    { key: "text", label: "Teks", type: "text" },
    { key: "speed", label: "Durasi (s)", type: "number", min: 3, max: 60 },
  ],
  reveal: [
    { key: "text", label: "Teks", type: "text" },
    { key: "mode", label: "Mode", type: "select", options: ["character", "word", "line"] },
  ],
  image: [
    { key: "url", label: "Gambar", type: "image" },
    { key: "caption", label: "Caption", type: "text" },
  ],
  slider: [{ key: "photos", label: "Foto", type: "photos" }],
  carousel: [{ key: "photos", label: "Foto", type: "photos" }],
  grid: [{ key: "photos", label: "Foto", type: "photos" }],
  masonry: [{ key: "photos", label: "Foto", type: "photos" }],
  polaroid: [{ key: "photos", label: "Foto", type: "photos" }],
  stack: [{ key: "photos", label: "Foto", type: "photos" }],
  circular: [{ key: "photos", label: "Foto", type: "photos" }],
  beforeafter: [
    { key: "before", label: "Sebelum", type: "image" },
    { key: "after", label: "Sesudah", type: "image" },
  ],
  background: [{ key: "url", label: "Gambar Latar", type: "image" }],
  video: [{ key: "url", label: "URL Video (mp4)", type: "text" }],
  embedvideo: [{ key: "url", label: "URL YouTube / Vimeo", type: "text" }],
  audio: [
    { key: "url", label: "URL Audio", type: "text" },
    { key: "title", label: "Judul", type: "text" },
  ],
  couple: [
    { key: "groom", label: "Nama Mempelai Pria", type: "text" },
    { key: "groomParents", label: "Orang Tua Pria", type: "text" },
    { key: "groomPhoto", label: "Foto Pria", type: "image" },
    { key: "bride", label: "Nama Mempelai Wanita", type: "text" },
    { key: "brideParents", label: "Orang Tua Wanita", type: "text" },
    { key: "bridePhoto", label: "Foto Wanita", type: "image" },
  ],
  person: [
    { key: "name", label: "Nama", type: "text" },
    { key: "parents", label: "Orang Tua", type: "text" },
    { key: "photo", label: "Foto", type: "image" },
    { key: "instagram", label: "Instagram", type: "text" },
  ],
  date: [{ key: "date", label: "Tanggal (YYYY-MM-DD)", type: "text" }],
  countdown: [{ key: "date", label: "Tanggal Target (YYYY-MM-DDTHH:mm)", type: "text" }],
  event: [
    { key: "title", label: "Nama Acara", type: "text" },
    { key: "date", label: "Tanggal", type: "text" },
    { key: "time", label: "Waktu", type: "text" },
    { key: "place", label: "Tempat", type: "text" },
    { key: "address", label: "Alamat", type: "textarea" },
    { key: "mapUrl", label: "Link Maps", type: "text" },
  ],
  story: [{ key: "items", label: "Kisah", type: "list" }],
  timeline: [{ key: "items", label: "Timeline", type: "list" }],
  location: [
    { key: "place", label: "Nama Lokasi", type: "text" },
    { key: "address", label: "Alamat", type: "textarea" },
    { key: "mapUrl", label: "Link Maps", type: "text" },
  ],
  map: [{ key: "query", label: "Alamat / Query Maps", type: "text" }],
  button: [
    { key: "label", label: "Label", type: "text" },
    { key: "url", label: "Link", type: "text" },
  ],
  social: [{ key: "items", label: "Akun (nama|url per baris)", type: "list" }],
  guestname: [
    { key: "prefix", label: "Teks Pembuka", type: "text" },
    { key: "suffix", label: "Teks Penutup", type: "text" },
  ],
  rsvp: [
    { key: "title", label: "Judul", type: "text" },
    { key: "note", label: "Catatan", type: "textarea" },
  ],
  wishes: [{ key: "title", label: "Judul", type: "text" }],
  bank: [
    { key: "bank", label: "Bank / E-Wallet", type: "text" },
    { key: "number", label: "Nomor Rekening", type: "text" },
    { key: "holder", label: "Atas Nama", type: "text" },
  ],
  qrcode: [
    { key: "data", label: "Isi QR", type: "text" },
    { key: "caption", label: "Caption", type: "text" },
  ],
  divider: [{ key: "variant", label: "Variasi", type: "select", options: ["line", "dots", "ornament"] }],
  spacer: [{ key: "height", label: "Tinggi (px)", type: "number", min: 4, max: 400 }],
  icon: [
    { key: "name", label: "Ikon", type: "select", options: ["heart", "flower", "ring", "star", "leaf"] },
    { key: "size", label: "Ukuran", type: "number", min: 8, max: 200 },
  ],
  shape: [
    { key: "variant", label: "Bentuk", type: "select", options: ["circle", "line", "square"] },
    { key: "size", label: "Ukuran", type: "number", min: 8, max: 400 },
  ],
  particles: [
    { key: "variant", label: "Efek", type: "select", options: ["confetti", "sparkle", "petal"] },
    { key: "count", label: "Jumlah", type: "number", min: 5, max: 120 },
  ],
  "open-button": [
    { key: "label", label: "Teks Tombol", type: "text" },
    { key: "caption", label: "Teks Kecil di Atas", type: "text" },
    { key: "guestPrefix", label: "Sapaan Tamu", type: "text", placeholder: "Kepada" },
  ],
  html: [{ key: "html", label: "HTML", type: "textarea" }],
};

const BEHAVIOR: Partial<Record<RenderKind, ControlDef[]>> = {
  slider: [
    { key: "autoplay", label: "Autoplay", type: "toggle" },
    { key: "loop", label: "Loop", type: "toggle" },
    { key: "swipe", label: "Swipe", type: "toggle" },
    { key: "navigation", label: "Navigasi", type: "toggle" },
    { key: "speed", label: "Kecepatan (s)", type: "number", min: 1, max: 15 },
    { key: "transition", label: "Transisi", type: "select", options: ["slide", "fade", "coverflow"] },
  ],
  carousel: [
    { key: "autoplay", label: "Autoplay", type: "toggle" },
    { key: "speed", label: "Kecepatan (s)", type: "number", min: 1, max: 15 },
    { key: "transition", label: "Transisi", type: "select", options: ["slide", "fade"] },
  ],
  grid: [{ key: "columns", label: "Kolom", type: "number", min: 1, max: 6 }],
  masonry: [{ key: "columns", label: "Kolom", type: "number", min: 1, max: 5 }],
  polaroid: [{ key: "columns", label: "Kolom", type: "number", min: 1, max: 5 }],
  video: [
    { key: "autoplay", label: "Autoplay", type: "toggle" },
    { key: "loop", label: "Loop", type: "toggle" },
    { key: "muted", label: "Mute", type: "toggle" },
    { key: "controls", label: "Kontrol", type: "toggle" },
  ],
  audio: [
    { key: "autoplay", label: "Autoplay", type: "toggle" },
    { key: "loop", label: "Loop", type: "toggle" },
  ],
  button: [
    { key: "variant", label: "Gaya", type: "select", options: ["solid", "outline", "ghost"] },
    { key: "newTab", label: "Buka Tab Baru", type: "toggle" },
    { key: "fullWidth", label: "Lebar Penuh", type: "toggle" },
  ],
  image: [{ key: "lightbox", label: "Lightbox", type: "toggle" }],
  "open-button": [
    { key: "showGuest", label: "Tampilkan Nama Tamu", type: "toggle" },
    { key: "shimmer", label: "Efek Kilau", type: "toggle" },
    { key: "pulse", label: "Efek Denyut", type: "toggle" },
    { key: "fullWidth", label: "Lebar Penuh", type: "toggle" },
  ],
};

export const ANIMATION_EFFECTS = [
  "none",
  "fade",
  "slide",
  "zoom",
  "scale",
  "rotate",
  "bounce",
  "float",
  "pulse",
  "reveal",
  "parallax",
  "kenburns",
];

interface Def {
  type: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  render: RenderKind;
  content?: Record<string, ContentValue>;
  style?: StyleConfig;
  behavior?: Record<string, ContentValue>;
}

const DEFS: Def[] = [
  // ---------- TEXT ----------
  { type: "heading", name: "Heading", category: "Text", description: "Judul besar", icon: "Heading1", render: "heading", content: { text: "Pernikahan Kami" }, style: { fontSize: 40, align: "center", fontWeight: 500 } },
  { type: "subheading", name: "Subheading", category: "Text", description: "Judul pendukung", icon: "Heading2", render: "heading", content: { text: "Save the Date" }, style: { fontSize: 24, align: "center" } },
  { type: "paragraph", name: "Paragraph", category: "Text", description: "Teks paragraf", icon: "AlignLeft", render: "text", content: { text: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan kami." }, style: { align: "center", fontSize: 16 } },
  { type: "richtext", name: "Rich Text", category: "Text", description: "Teks dengan HTML", icon: "FileText", render: "richtext", content: { html: "<p>Teks <strong>kaya</strong> format.</p>" } },
  { type: "quote", name: "Quote", category: "Text", description: "Kutipan / ayat", icon: "Quote", render: "quote", content: { text: "Dan di antara tanda-tanda kekuasaan-Nya adalah Dia menciptakan pasangan untukmu.", source: "QS. Ar-Rum: 21" }, style: { align: "center" } },
  { type: "caption", name: "Caption", category: "Text", description: "Teks kecil", icon: "Type", render: "text", content: { text: "Caption foto" }, style: { fontSize: 13, align: "center", opacity: 0.7 } },
  { type: "label", name: "Label", category: "Text", description: "Label huruf besar", icon: "Tag", render: "heading", content: { text: "AKAD NIKAH" }, style: { fontSize: 13, letterSpacing: 4, align: "center" } },
  { type: "typing", name: "Typing Text", category: "Text", description: "Efek mesin tik", icon: "Keyboard", render: "typing", content: { text: "Kami Menikah", speed: 110 }, style: { align: "center", fontSize: 28 } },
  { type: "scrolling", name: "Scrolling Text", category: "Text", description: "Teks berjalan", icon: "MoveHorizontal", render: "marquee", content: { text: "Andi & Sari", speed: 18 } },
  { type: "marquee", name: "Marquee", category: "Text", description: "Marquee besar", icon: "Megaphone", render: "marquee", content: { text: "SAVE THE DATE • 12 . 12 . 2026 •", speed: 24 }, style: { fontSize: 40 } },
  { type: "text-reveal", name: "Text Reveal", category: "Text", description: "Teks muncul per baris", icon: "Sparkles", render: "reveal", content: { text: "Bersama menuju selamanya", mode: "line" }, style: { align: "center", fontSize: 26 } },
  { type: "char-reveal", name: "Character Reveal", category: "Text", description: "Muncul per karakter", icon: "Sparkle", render: "reveal", content: { text: "Andi & Sari", mode: "character" }, style: { align: "center", fontSize: 34 } },
  { type: "word-reveal", name: "Word Reveal", category: "Text", description: "Muncul per kata", icon: "Sparkles", render: "reveal", content: { text: "Kami mengundang Anda", mode: "word" }, style: { align: "center", fontSize: 28 } },
  { type: "highlight", name: "Highlight Text", category: "Text", description: "Teks dengan sorotan", icon: "Highlighter", render: "heading", content: { text: "Terima kasih" }, style: { align: "center", fontSize: 28, bgColor: "#f4e6cf", paddingX: 12, paddingY: 6 } },

  // ---------- IMAGE ----------
  { type: "image", name: "Single Image", category: "Image", description: "Satu gambar", icon: "Image", render: "image", content: { url: DEMO[0], caption: "" }, style: { radius: 12 } },
  { type: "image-slider", name: "Image Slider", category: "Image", description: "Slider foto", icon: "GalleryHorizontal", render: "slider", content: { photos: DEMO.map(photo) }, behavior: { autoplay: true, loop: true, swipe: true, navigation: true, speed: 3, transition: "fade" }, style: { radius: 16, minHeight: 320 } },
  { type: "horizontal-slider", name: "Horizontal Slider", category: "Image", description: "Slider geser", icon: "GalleryHorizontalEnd", render: "slider", content: { photos: DEMO.map(photo) }, behavior: { autoplay: false, swipe: true, navigation: true, transition: "slide", speed: 4 }, style: { radius: 16, minHeight: 320 } },
  { type: "swipe-gallery", name: "Swipe Gallery", category: "Image", description: "Galeri swipe", icon: "Hand", render: "slider", content: { photos: DEMO.map(photo) }, behavior: { swipe: true, navigation: false, transition: "slide", speed: 4 }, style: { radius: 16, minHeight: 300 } },
  { type: "auto-carousel", name: "Auto Carousel", category: "Image", description: "Carousel otomatis", icon: "RefreshCw", render: "carousel", content: { photos: DEMO.map(photo) }, behavior: { autoplay: true, speed: 3, transition: "slide" }, style: { radius: 16, minHeight: 280 } },
  { type: "fade-carousel", name: "Fade Carousel", category: "Image", description: "Transisi fade", icon: "Layers", render: "carousel", content: { photos: DEMO.map(photo) }, behavior: { autoplay: true, speed: 4, transition: "fade" }, style: { radius: 16, minHeight: 300 } },
  { type: "coverflow", name: "Coverflow", category: "Image", description: "Efek coverflow", icon: "Layers3", render: "circular", content: { photos: DEMO.map(photo) }, style: { minHeight: 260 } },
  { type: "kenburns", name: "Ken Burns", category: "Image", description: "Zoom lambat", icon: "ZoomIn", render: "image", content: { url: DEMO[1] }, style: { radius: 12, minHeight: 320 } },
  { type: "zoom-image", name: "Zoom Image", category: "Image", description: "Zoom saat hover", icon: "Search", render: "image", content: { url: DEMO[2] }, style: { radius: 12 }, behavior: { lightbox: true } },
  { type: "parallax-image", name: "Parallax Image", category: "Image", description: "Latar parallax", icon: "Mountain", render: "background", content: { url: DEMO[0] }, style: { minHeight: 320, overlay: 25 } },
  { type: "before-after", name: "Before / After", category: "Image", description: "Perbandingan foto", icon: "Columns2", render: "beforeafter", content: { before: DEMO[0], after: DEMO[1] }, style: { radius: 12 } },
  { type: "photo-grid", name: "Photo Grid", category: "Image", description: "Grid foto", icon: "Grid3x3", render: "grid", content: { photos: DEMO.map(photo) }, behavior: { columns: 3 }, style: { radius: 10 } },
  { type: "masonry", name: "Masonry", category: "Image", description: "Grid masonry", icon: "LayoutDashboard", render: "masonry", content: { photos: DEMO.map(photo) }, behavior: { columns: 3 }, style: { radius: 10 } },
  { type: "polaroid", name: "Polaroid", category: "Image", description: "Gaya polaroid", icon: "Camera", render: "polaroid", content: { photos: DEMO.map(photo) }, behavior: { columns: 3 } },
  { type: "photo-stack", name: "Stack", category: "Image", description: "Foto bertumpuk", icon: "Copy", render: "stack", content: { photos: DEMO.map(photo) } },
  { type: "scattered", name: "Scattered Photos", category: "Image", description: "Foto berserak", icon: "Shuffle", render: "stack", content: { photos: DEMO.map(photo) } },
  { type: "circular-gallery", name: "Circular Gallery", category: "Image", description: "Foto bulat", icon: "Circle", render: "circular", content: { photos: DEMO.map(photo) } },
  { type: "image-cards", name: "Image Cards", category: "Image", description: "Kartu foto", icon: "SquareStack", render: "grid", content: { photos: DEMO.map(photo) }, behavior: { columns: 2 }, style: { radius: 18, shadow: "lg" } },
  { type: "background-image", name: "Background Image", category: "Image", description: "Gambar latar penuh", icon: "ImagePlus", render: "background", content: { url: DEMO[2] }, style: { minHeight: 420, overlay: 35 } },
  { type: "lightbox", name: "Lightbox", category: "Image", description: "Klik untuk perbesar", icon: "Maximize2", render: "grid", content: { photos: DEMO.map(photo) }, behavior: { columns: 3, lightbox: true } },
  { type: "fullscreen-gallery", name: "Fullscreen Gallery", category: "Image", description: "Galeri layar penuh", icon: "Expand", render: "slider", content: { photos: DEMO.map(photo) }, behavior: { autoplay: true, speed: 4, transition: "fade", navigation: true }, style: { minHeight: 520 } },
  { type: "vertical-gallery", name: "Vertical Gallery", category: "Image", description: "Galeri vertikal", icon: "Rows3", render: "grid", content: { photos: DEMO.map(photo) }, behavior: { columns: 1 }, style: { radius: 12 } },
  { type: "horizontal-marquee", name: "Horizontal Marquee", category: "Image", description: "Foto berjalan", icon: "MoveHorizontal", render: "masonry", content: { photos: DEMO.map(photo) }, behavior: { columns: 4 } },

  // ---------- MEDIA ----------
  { type: "video", name: "Video", category: "Media", description: "Video mp4", icon: "Video", render: "video", content: { url: "" }, behavior: { controls: true, muted: true } },
  { type: "youtube", name: "YouTube", category: "Media", description: "Embed YouTube", icon: "Youtube", render: "embedvideo", content: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
  { type: "vimeo", name: "Vimeo", category: "Media", description: "Embed Vimeo", icon: "Film", render: "embedvideo", content: { url: "https://vimeo.com/76979871" } },
  { type: "background-video", name: "Background Video", category: "Media", description: "Video latar", icon: "MonitorPlay", render: "video", content: { url: "" }, behavior: { autoplay: true, loop: true, muted: true, controls: false }, style: { minHeight: 360 } },
  { type: "audio", name: "Audio", category: "Media", description: "Pemutar audio", icon: "Music", render: "audio", content: { url: "", title: "Lagu Kami" } },
  { type: "music-player", name: "Music Player", category: "Media", description: "Musik latar", icon: "Music4", render: "audio", content: { url: "", title: "Backsound" }, behavior: { autoplay: false, loop: true } },

  // ---------- WEDDING ----------
  { type: "couple", name: "Couple Profile", category: "Wedding", description: "Profil kedua mempelai", icon: "Heart", render: "couple", content: { groom: "Andi Pratama", groomParents: "Putra dari Bpk. Budi & Ibu Rina", groomPhoto: DEMO[0], bride: "Sari Melati", brideParents: "Putri dari Bpk. Joko & Ibu Wati", bridePhoto: DEMO[1] } },
  { type: "groom", name: "Groom", category: "Wedding", description: "Mempelai pria", icon: "User", render: "person", content: { name: "Andi Pratama", parents: "Putra dari Bpk. Budi & Ibu Rina", photo: DEMO[0], instagram: "" } },
  { type: "bride", name: "Bride", category: "Wedding", description: "Mempelai wanita", icon: "User", render: "person", content: { name: "Sari Melati", parents: "Putri dari Bpk. Joko & Ibu Wati", photo: DEMO[1], instagram: "" } },
  { type: "wedding-date", name: "Wedding Date", category: "Wedding", description: "Tanggal pernikahan", icon: "CalendarHeart", render: "date", content: { date: "2026-12-12" } },
  { type: "countdown", name: "Countdown", category: "Wedding", description: "Hitung mundur", icon: "Timer", render: "countdown", content: { date: "2026-12-12T08:00" } },
  { type: "event", name: "Event", category: "Wedding", description: "Detail acara", icon: "CalendarDays", render: "event", content: { title: "Resepsi", date: "Sabtu, 12 Desember 2026", time: "11.00 - 14.00 WIB", place: "Gedung Graha Mulia", address: "Jl. Merdeka No. 10, Jakarta", mapUrl: "" } },
  { type: "akad", name: "Akad", category: "Wedding", description: "Acara akad nikah", icon: "BookHeart", render: "event", content: { title: "Akad Nikah", date: "Sabtu, 12 Desember 2026", time: "08.00 WIB", place: "Masjid Al-Ikhlas", address: "Jl. Merdeka No. 8, Jakarta", mapUrl: "" } },
  { type: "resepsi", name: "Resepsi", category: "Wedding", description: "Acara resepsi", icon: "PartyPopper", render: "event", content: { title: "Resepsi", date: "Sabtu, 12 Desember 2026", time: "11.00 WIB", place: "Gedung Graha Mulia", address: "Jl. Merdeka No. 10, Jakarta", mapUrl: "" } },
  { type: "love-story", name: "Love Story", category: "Wedding", description: "Kisah cinta", icon: "HeartHandshake", render: "story", content: { items: "2019|Pertama Bertemu|Kami bertemu di kampus.\n2023|Tunangan|Momen yang tak terlupakan.\n2026|Menikah|Awal babak baru." } },
  { type: "timeline", name: "Timeline", category: "Wedding", description: "Rangkaian acara", icon: "GitCommitHorizontal", render: "timeline", content: { items: "08.00|Akad Nikah|Masjid Al-Ikhlas\n11.00|Resepsi|Graha Mulia\n14.00|Sesi Foto|Graha Mulia" } },
  { type: "wedding-quote", name: "Wedding Quote", category: "Wedding", description: "Kutipan pernikahan", icon: "Quote", render: "quote", content: { text: "Cinta adalah janji yang dirawat setiap hari.", source: "" }, style: { align: "center" } },
  { type: "location", name: "Location", category: "Wedding", description: "Info lokasi", icon: "MapPin", render: "location", content: { place: "Gedung Graha Mulia", address: "Jl. Merdeka No. 10, Jakarta", mapUrl: "" } },
  { type: "google-maps", name: "Google Maps", category: "Wedding", description: "Peta lokasi", icon: "Map", render: "map", content: { query: "Monas Jakarta" }, style: { radius: 12, minHeight: 280 } },
  { type: "calendar", name: "Calendar", category: "Wedding", description: "Tanggal berbentuk kalender", icon: "Calendar", render: "date", content: { date: "2026-12-12" } },

  // ---------- INTERACTIVE ----------
  { type: "open-invitation", name: "Buka Undangan", category: "Interactive", description: "Tombol pembuka cover (Section 1)", icon: "MailOpen", render: "open-button", content: { label: "Buka Undangan", caption: "Undangan Pernikahan", guestPrefix: "Kepada" }, style: { align: "center", bgColor: "#b08d57", textColor: "#ffffff", radius: 999, fontSize: 15 }, behavior: { showGuest: true, shimmer: true, pulse: true } },
  { type: "button", name: "Button", category: "Interactive", description: "Tombol link", icon: "MousePointerClick", render: "button", content: { label: "Buka Undangan", url: "#" }, behavior: { variant: "solid" } },
  { type: "whatsapp", name: "WhatsApp", category: "Interactive", description: "Chat WhatsApp", icon: "MessageCircle", render: "button", content: { label: "Hubungi via WhatsApp", url: "https://wa.me/628123456789" }, behavior: { variant: "outline", newTab: true } },
  { type: "maps-button", name: "Maps Button", category: "Interactive", description: "Tombol arah lokasi", icon: "Navigation", render: "button", content: { label: "Lihat Lokasi", url: "https://maps.google.com" }, behavior: { variant: "outline", newTab: true } },
  { type: "calendar-button", name: "Calendar Button", category: "Interactive", description: "Simpan ke kalender", icon: "CalendarPlus", render: "button", content: { label: "Simpan Tanggal", url: "#" }, behavior: { variant: "ghost" } },
  { type: "social", name: "Social Media", category: "Interactive", description: "Kumpulan sosial media", icon: "Share2", render: "social", content: { items: "Instagram|https://instagram.com\nTikTok|https://tiktok.com" } },
  { type: "instagram", name: "Instagram", category: "Interactive", description: "Link Instagram", icon: "Instagram", render: "button", content: { label: "@undangan.kami", url: "https://instagram.com" }, behavior: { variant: "ghost", newTab: true } },
  { type: "tiktok", name: "TikTok", category: "Interactive", description: "Link TikTok", icon: "Music2", render: "button", content: { label: "TikTok Kami", url: "https://tiktok.com" }, behavior: { variant: "ghost", newTab: true } },
  { type: "facebook", name: "Facebook", category: "Interactive", description: "Link Facebook", icon: "Facebook", render: "button", content: { label: "Facebook", url: "https://facebook.com" }, behavior: { variant: "ghost", newTab: true } },
  { type: "custom-link", name: "Custom Link", category: "Interactive", description: "Link bebas", icon: "Link", render: "button", content: { label: "Link", url: "https://" }, behavior: { variant: "outline" } },
  { type: "scroll-to", name: "Scroll to Section", category: "Interactive", description: "Gulir ke bagian", icon: "ArrowDownToLine", render: "button", content: { label: "Lihat Detail", url: "#section" }, behavior: { variant: "ghost" } },
  { type: "copy-text", name: "Copy Text", category: "Interactive", description: "Salin teks", icon: "ClipboardCopy", render: "bank", content: { bank: "Salin", number: "Teks yang disalin", holder: "" } },

  // ---------- GUEST ----------
  { type: "guest-name", name: "Guest Name", category: "Guest", description: "Nama tamu dari token", icon: "UserRound", render: "guestname", content: { prefix: "Kepada Yth.", suffix: "di tempat" }, style: { align: "center" } },
  { type: "guest-greeting", name: "Guest Greeting", category: "Guest", description: "Sapaan personal", icon: "Smile", render: "guestname", content: { prefix: "Dengan hormat,", suffix: "Kami mengundang Anda" }, style: { align: "center" } },
  { type: "guest-category", name: "Guest Category", category: "Guest", description: "Kategori tamu", icon: "Users", render: "guestname", content: { prefix: "", suffix: "", showCategory: true }, style: { align: "center" } },
  { type: "rsvp", name: "RSVP", category: "Guest", description: "Form konfirmasi kehadiran", icon: "ClipboardCheck", render: "rsvp", content: { title: "Konfirmasi Kehadiran", note: "Mohon konfirmasi sebelum 1 Desember 2026." } },
  { type: "attendance", name: "Attendance", category: "Guest", description: "Konfirmasi hadir", icon: "CheckCheck", render: "rsvp", content: { title: "Kehadiran", note: "" } },
  { type: "guest-wishes", name: "Guest Wishes", category: "Guest", description: "Ucapan & doa tamu", icon: "MessageSquareHeart", render: "wishes", content: { title: "Ucapan & Doa" } },

  // ---------- GIFT ----------
  { type: "bank-account", name: "Bank Account", category: "Gift", description: "Rekening bank", icon: "Landmark", render: "bank", content: { bank: "BCA", number: "1234567890", holder: "Andi Pratama" } },
  { type: "ewallet", name: "E-Wallet", category: "Gift", description: "Dompet digital", icon: "Wallet", render: "bank", content: { bank: "GoPay", number: "08123456789", holder: "Sari Melati" } },
  { type: "qrcode", name: "QR Code", category: "Gift", description: "QR pembayaran / link", icon: "QrCode", render: "qrcode", content: { data: "https://example.com", caption: "Scan untuk hadiah" } },
  { type: "gift-info", name: "Gift Information", category: "Gift", description: "Info kirim hadiah", icon: "Gift", render: "text", content: { text: "Kehadiran Anda merupakan hadiah terindah. Namun jika ingin memberi tanda kasih, dapat melalui rekening di bawah." }, style: { align: "center" } },
  { type: "copy-account", name: "Copy Account", category: "Gift", description: "Salin nomor rekening", icon: "Copy", render: "bank", content: { bank: "Mandiri", number: "9876543210", holder: "Andi & Sari" } },

  // ---------- DECORATION ----------
  { type: "divider", name: "Divider", category: "Decoration", description: "Pemisah", icon: "Minus", render: "divider", content: { variant: "ornament" } },
  { type: "spacer", name: "Spacer", category: "Decoration", description: "Ruang kosong", icon: "MoveVertical", render: "spacer", content: { height: 48 } },
  { type: "deco-icon", name: "Icon", category: "Decoration", description: "Ikon dekoratif", icon: "Heart", render: "icon", content: { name: "heart", size: 32 } },
  { type: "shape", name: "Shape", category: "Decoration", description: "Bentuk geometris", icon: "Square", render: "shape", content: { variant: "square", size: 60 } },
  { type: "circle", name: "Circle", category: "Decoration", description: "Bulatan", icon: "Circle", render: "shape", content: { variant: "circle", size: 60 } },
  { type: "line", name: "Line", category: "Decoration", description: "Garis", icon: "Minus", render: "shape", content: { variant: "line", size: 120 } },
  { type: "ornament", name: "Ornament", category: "Decoration", description: "Ornamen floral", icon: "Flower2", render: "icon", content: { name: "flower", size: 40 } },
  { type: "decorative-image", name: "Decorative Image", category: "Decoration", description: "Gambar hiasan", icon: "ImagePlus", render: "image", content: { url: DEMO[1] }, style: { opacity: 0.6, radius: 999 } },
  { type: "floating-element", name: "Floating Element", category: "Decoration", description: "Elemen mengapung", icon: "Wind", render: "icon", content: { name: "leaf", size: 36 } },
  { type: "confetti", name: "Confetti", category: "Decoration", description: "Efek confetti", icon: "PartyPopper", render: "particles", content: { variant: "confetti", count: 40 } },
  { type: "sparkle", name: "Sparkle", category: "Decoration", description: "Efek kilau", icon: "Sparkles", render: "particles", content: { variant: "sparkle", count: 30 } },
  { type: "particle", name: "Particle", category: "Decoration", description: "Partikel kelopak", icon: "Snowflake", render: "particles", content: { variant: "petal", count: 25 } },

  // ---------- CUSTOM ----------
  { type: "custom-html", name: "Custom HTML", category: "Custom", description: "HTML bebas", icon: "Code", render: "html", content: { html: "<div style='text-align:center'>Custom HTML</div>" } },
  { type: "embed", name: "Embed", category: "Custom", description: "Embed iframe", icon: "Frame", render: "html", content: { html: "<iframe src='https://example.com' style='width:100%;height:300px;border:0'></iframe>" } },
  { type: "custom-variable", name: "Custom Variable", category: "Custom", description: "Teks dengan variabel {{nama}}", icon: "Braces", render: "text", content: { text: "Halo {{guest}}, terima kasih." }, style: { align: "center" } },
];

export const FIELD_REGISTRY: Record<string, FieldDefinition> = Object.fromEntries(
  DEFS.map((d) => [
    d.type,
    {
      type: d.type,
      name: d.name,
      category: d.category,
      description: d.description,
      icon: d.icon,
      render: d.render,
      controls: CONTROLS[d.render] ?? [],
      defaultContent: d.content ?? {},
      defaultStyle: d.style ?? {},
      defaultBehavior: d.behavior ?? {},
      defaultAnimation: { effect: "fade", trigger: "scroll", duration: 700, delay: 0, repeat: "once", direction: "up" },
    } satisfies FieldDefinition,
  ]),
);

export const FIELD_CATEGORIES = ["Text", "Image", "Media", "Wedding", "Interactive", "Guest", "Gift", "Decoration", "Custom"];

export const behaviorControls = (render: RenderKind): ControlDef[] => BEHAVIOR[render] ?? [];

export const getDefinition = (type: string): FieldDefinition | undefined => FIELD_REGISTRY[type];

export const createField = (type: string): FieldNode => {
  const def = FIELD_REGISTRY[type];
  return {
    id: uid("f"),
    type,
    content: JSON.parse(JSON.stringify(def?.defaultContent ?? {})),
    style: { ...(def?.defaultStyle ?? {}) },
    behavior: { ...(def?.defaultBehavior ?? {}) },
    animation: { ...(def?.defaultAnimation ?? {}) },
    responsive: {},
  };
};
