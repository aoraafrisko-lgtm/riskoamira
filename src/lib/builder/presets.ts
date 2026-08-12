import { createField } from "./registry";
import type { SectionNode, SubsectionNode } from "./types";
import { uid } from "./types";

export interface PresetOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SECTION_PRESETS: PresetOption[] = [
  { id: "blank", name: "Blank Section", description: "Section kosong (default)", icon: "Square" },
  { id: "background", name: "Section dengan Background", description: "Latar gambar + overlay", icon: "Image" },
  { id: "fullscreen", name: "Section Full Screen", description: "Tinggi satu layar", icon: "Monitor" },
  { id: "split", name: "Section Split", description: "Dua kolom berdampingan", icon: "Columns2" },
  { id: "gallery", name: "Section Gallery", description: "Galeri foto", icon: "GalleryVerticalEnd" },
  { id: "custom", name: "Custom", description: "Section bebas", icon: "Code" },
];

export const SUBSECTION_PRESETS: PresetOption[] = [
  { id: "blank", name: "Blank", description: "Tanpa field", icon: "Square" },
  { id: "text", name: "Text", description: "Heading + paragraf", icon: "Type" },
  { id: "image", name: "Image", description: "Satu gambar", icon: "Image" },
  { id: "image-text", name: "Image + Text", description: "Gambar dan teks", icon: "Columns2" },
  { id: "gallery", name: "Gallery", description: "Grid foto", icon: "Grid3x3" },
  { id: "event", name: "Event", description: "Detail acara", icon: "CalendarDays" },
  { id: "couple", name: "Couple", description: "Profil mempelai", icon: "Heart" },
  { id: "custom", name: "Custom", description: "Kosong, bebas diatur", icon: "Code" },
];

export const createSubsection = (preset: string, index: number): SubsectionNode => {
  const base: SubsectionNode = {
    id: uid("sub"),
    name: `Subsection ${index}`,
    preset,
    layout: "stack",
    style: { paddingY: 16, paddingX: 0 },
    animation: { effect: "fade", trigger: "scroll", duration: 700, delay: 0, repeat: "once", direction: "up" },
    fields: [],
  };
  switch (preset) {
    case "text":
      base.fields = [createField("heading"), createField("paragraph")];
      break;
    case "image":
      base.fields = [createField("image")];
      break;
    case "image-text":
      base.layout = "grid-2";
      base.fields = [createField("image"), createField("paragraph")];
      break;
    case "gallery":
      base.fields = [createField("photo-grid")];
      break;
    case "event":
      base.fields = [createField("event")];
      break;
    case "couple":
      base.fields = [createField("couple")];
      break;
    default:
      break;
  }
  return base;
};

export const createSection = (preset: string, index: number): SectionNode => {
  const section: SectionNode = {
    id: uid("sec"),
    name: `Section ${index}`,
    preset,
    style: { paddingY: 56, paddingX: 24 },
    animation: { effect: "none", trigger: "scroll", duration: 700, delay: 0, repeat: "once", direction: "up" },
    subsections: [],
  };
  switch (preset) {
    case "background":
      section.style = {
        ...section.style,
        bgImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
        overlay: 40,
        textColor: "#ffffff",
        minHeight: 420,
      };
      section.subsections = [createSubsection("text", 1)];
      break;
    case "fullscreen":
      section.style = { ...section.style, minHeight: 640 };
      section.subsections = [createSubsection("text", 1)];
      break;
    case "split":
      section.subsections = [createSubsection("image-text", 1)];
      break;
    case "gallery":
      section.subsections = [createSubsection("gallery", 1)];
      break;
    default:
      break;
  }
  return section;
};
