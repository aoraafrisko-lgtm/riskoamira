/** Font yang umum dipakai untuk undangan pernikahan. */
export const SCRIPT_FONTS = [
  "Great Vibes",
  "Parisienne",
  "Dancing Script",
  "Pinyon Script",
  "Sacramento",
  "Allura",
  "Italianno",
  "Tangerine",
];

export const SERIF_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "EB Garamond",
  "Marcellus",
  "Cinzel",
  "Libre Baskerville",
  "Lora",
];

export const SANS_FONTS = ["Jost", "Montserrat", "Raleway", "Quicksand", "Inter"];

export const WEDDING_FONTS = [...SCRIPT_FONTS, ...SERIF_FONTS, ...SANS_FONTS];

export const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: "Script / Kaligrafi", fonts: SCRIPT_FONTS },
  { label: "Serif Klasik", fonts: SERIF_FONTS },
  { label: "Sans Modern", fonts: SANS_FONTS },
];

/** Ubah nama font menjadi CSS font-family (dengan fallback). */
export const fontFamilyCss = (name?: string) => {
  if (!name) return undefined;
  if (name.includes(",") || name.includes("'") || name.includes('"')) return name;
  const serif = [...SCRIPT_FONTS, ...SERIF_FONTS].includes(name);
  return `'${name}', ${serif ? "serif" : "sans-serif"}`;
};

/** Ambil nama font dari nilai CSS font-family. */
export const fontNameFromCss = (value?: string) => {
  if (!value) return "";
  const first = value.split(",")[0] ?? "";
  return first.replace(/['"]/g, "").trim();
};

export const googleFontsHref = (names: string[]) =>
  `https://fonts.googleapis.com/css2?${names
    .map((n) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@300;400;500;600;700`)
    .join("&")}&display=swap`;

const loaded = new Set<string>();

/** Muat font Google secara dinamis (untuk nama font yang ditulis manual). */
export const ensureFontLoaded = (name?: string) => {
  if (typeof document === "undefined") return;
  const clean = fontNameFromCss(name);
  if (!clean || loaded.has(clean)) return;
  loaded.add(clean);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleFontsHref([clean]);
  document.head.appendChild(link);
};
