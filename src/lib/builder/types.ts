export type Breakpoint = "desktop" | "tablet" | "mobile";

export type BgPosition =
  | "center"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"
  | "top-left";

export interface BgConfig {
  bgImage?: string;
  bgGradient?: string;
  /** cover | contain | fill | repeat */
  bgSize?: "cover" | "contain" | "fill" | "repeat";
  bgPosition?: BgPosition;
  /** zoom/skala lapisan latar (1 = normal) */
  bgZoom?: number;
  /** rotasi lapisan latar (derajat) */
  bgRotate?: number;
  bgOffsetX?: number;
  bgOffsetY?: number;
  /** opacity khusus lapisan latar (0-1), tidak mempengaruhi konten */
  bgOpacity?: number;
  /** overlay hitam di atas latar (0-100) */
  overlay?: number;
}

export interface StyleConfig extends BgConfig {
  bgColor?: string;
  /** true = latar dibuat transparan (warna latar diabaikan) */
  transparent?: boolean;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  width?: string;
  minHeight?: number;
  paddingY?: number;
  paddingX?: number;
  marginTop?: number;
  marginBottom?: number;
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  rotate?: number;
  zIndex?: number;
  /** cara gambar mengisi kotak: cover = crop, contain = muat utuh, fill = boleh melar */
  fit?: "cover" | "contain" | "fill";
  /** titik fokus crop gambar */
  focal?: BgPosition;
}


export interface AnimationConfig {
  effect?: string;
  trigger?: "load" | "scroll";
  duration?: number;
  delay?: number;
  repeat?: "once" | "loop";
  direction?: "up" | "down" | "left" | "right";
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type ContentValue = string | number | boolean | Photo[] | { [key: string]: Json } | undefined;

/** Free-position placement (percent of canvas width / px offset from top). */
export interface FreePos {
  x?: number; // % of canvas width (left)
  y?: number; // px from canvas top
  w?: number; // % of canvas width
  /** tinggi tetap (px logis). undefined = tinggi otomatis mengikuti isi */
  h?: number | undefined;
  z?: number;
}

export interface FieldNode {
  id: string;
  type: string;
  hidden?: boolean;
  /** true = field lepas dari alur (bisa digerakkan bebas ke mana pun, boleh menimpa field lain) */
  free?: boolean;
  content: Record<string, ContentValue>;
  style: StyleConfig;
  behavior: Record<string, ContentValue>;
  animation: AnimationConfig;
  responsive: Partial<Record<Breakpoint, StyleConfig>>;
  pos?: FreePos;
  posResponsive?: Partial<Record<Breakpoint, FreePos>>;
}

export interface SubsectionNode {
  id: string;
  name: string;
  preset: string;
  hidden?: boolean;
  layout?: "stack" | "row" | "grid-2" | "grid-3" | "free";
  canvasHeight?: number;
  style: StyleConfig;
  animation: AnimationConfig;
  fields: FieldNode[];
}

export interface SectionNode {
  id: string;
  name: string;
  preset: string;
  hidden?: boolean;
  style: StyleConfig;
  animation: AnimationConfig;
  subsections: SubsectionNode[];
}

export interface ThemeConfig extends BgConfig {
  fontHeading?: string;
  fontBody?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}


export interface InvitationConfig {
  title?: string;
  theme: ThemeConfig;
  sections: SectionNode[];
}

export type SelectionKind = "section" | "subsection" | "field";

export interface Selection {
  kind: SelectionKind;
  sectionId: string;
  subsectionId?: string;
  fieldId?: string;
}

export const emptyConfig = (): InvitationConfig => ({
  title: "Undangan Pernikahan",
  theme: {
    fontHeading: "'Cormorant Garamond', serif",
    fontBody: "'Jost', sans-serif",
    bgColor: "#fbf8f4",
    textColor: "#3b332c",
    accentColor: "#b08d57",
  },
  sections: [],
});

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
