export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface StyleConfig {
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
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
  overlay?: number;
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

export interface ThemeConfig {
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
