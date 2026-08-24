import type { CSSProperties } from "react";
import { fontFamilyCss } from "./fonts";
import type { AnimationConfig, BgConfig, Breakpoint, FieldNode, StyleConfig } from "./types";


export const mergeStyle = (base: StyleConfig, override?: StyleConfig): StyleConfig => ({
  ...base,
  ...(override ?? {}),
});

export const resolveStyle = (node: FieldNode, bp: Breakpoint): StyleConfig =>
  mergeStyle(node.style, node.responsive?.[bp]);

/**
 * Kanvas kini berukuran tetap 1080×1920 dan diskalakan sebagai satu kesatuan,
 * jadi tidak ada lagi penyesuaian gaya per breakpoint (WYSIWYG penuh).
 */
export const scaleStyle = (s: StyleConfig, _bp: Breakpoint): StyleConfig => s;

export const resolvePos = (node: FieldNode, bp: Breakpoint) => ({
  x: 0,
  y: 0,
  w: 40,
  ...(node.pos ?? {}),
  ...(node.posResponsive?.[bp] ?? {}),
});

const shadowMap: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 6px 16px rgba(0,0,0,.10)",
  lg: "0 16px 40px rgba(0,0,0,.14)",
  xl: "0 30px 70px rgba(0,0,0,.20)",
};

const POSITION_MAP: Record<string, string> = {
  center: "center center",
  top: "center top",
  "top-right": "right top",
  right: "right center",
  "bottom-right": "right bottom",
  bottom: "center bottom",
  "bottom-left": "left bottom",
  left: "left center",
  "top-left": "left top",
};

/**
 * Gaya untuk lapisan latar terpisah (absolute), agar zoom/rotate/opacity latar
 * tidak mempengaruhi konten (teks tetap tegak & pekat).
 */
export const bgLayerStyle = (s: BgConfig = {}): CSSProperties => {
  if (!s.bgImage && !s.bgGradient) return {};
  const zoom = s.bgZoom ?? 1;
  const rotate = s.bgRotate ?? 0;
  const ox = s.bgOffsetX ?? 0;
  const oy = s.bgOffsetY ?? 0;
  const size =
    s.bgSize === "contain" ? "contain" : s.bgSize === "fill" ? "100% 100%" : s.bgSize === "repeat" ? "auto" : "cover";
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: [s.bgImage ? `url(${s.bgImage})` : null, s.bgGradient || null].filter(Boolean).join(", "),
    backgroundSize: s.bgImage ? size : undefined,
    backgroundPosition: POSITION_MAP[s.bgPosition ?? "center"] ?? "center center",
    backgroundRepeat: s.bgSize === "repeat" ? "repeat" : "no-repeat",
    opacity: s.bgOpacity ?? 1,
    transform: `translate(${ox}%, ${oy}%) rotate(${rotate}deg) scale(${zoom})`,
    transformOrigin: "center center",
    pointerEvents: "none",
  };
};

export const styleToCss = (s: StyleConfig = {}): CSSProperties => {
  const css: CSSProperties = {};
  if (s.bgColor && !s.transparent) css.backgroundColor = s.bgColor;
  if (s.transparent) css.backgroundColor = "transparent";
  if (s.textColor) css.color = s.textColor;
  if (s.fontFamily) css.fontFamily = fontFamilyCss(s.fontFamily);

  if (s.fontSize) css.fontSize = `${s.fontSize}px`;
  if (s.fontWeight) css.fontWeight = s.fontWeight;
  if (s.letterSpacing !== undefined) css.letterSpacing = `${s.letterSpacing}px`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.align) css.textAlign = s.align;
  if (s.width) css.width = s.width;
  if (s.minHeight) css.minHeight = `${s.minHeight}px`;
  if (s.paddingY !== undefined || s.paddingX !== undefined)
    css.padding = `${s.paddingY ?? 0}px ${s.paddingX ?? 0}px`;
  if (s.marginTop !== undefined) css.marginTop = `${s.marginTop}px`;
  if (s.marginBottom !== undefined) css.marginBottom = `${s.marginBottom}px`;
  if (s.borderWidth) css.border = `${s.borderWidth}px solid ${s.borderColor ?? "currentColor"}`;
  if (s.radius !== undefined) css.borderRadius = `${s.radius}px`;
  if (s.shadow && s.shadow !== "none") css.boxShadow = shadowMap[s.shadow];
  if (s.opacity !== undefined) css.opacity = s.opacity;
  if (s.rotate) css.transform = `rotate(${s.rotate}deg)`;
  if (s.zIndex !== undefined) css.zIndex = s.zIndex;
  return css;
};

/** Efek yang memang berupa animasi berulang (bukan animasi masuk). */
const AMBIENT = ["float", "pulse", "kenburns", "shimmer", "parallax"];

export const animationCss = (a: AnimationConfig = {}, visible = true): CSSProperties => {
  const effect = a.effect ?? "none";
  if (effect === "none") return {};
  const duration = `${a.duration ?? 700}ms`;
  const delay = `${a.delay ?? 0}ms`;
  // Efek ambient (float/pulse/kenburns/shimmer/parallax) selalu berjalan terus-menerus.
  // Efek masuk dengan Repeat = loop diputar ulang setiap elemen kembali masuk viewport
  // (lihat useReveal), bukan dibuat infinite di sini.
  if (AMBIENT.includes(effect)) {
    return {
      opacity: 1,
      animation: `inv-${effect} ${duration} ease-in-out ${delay} infinite alternate`,
    };
  }


  // Animasi masuk memantul
  if (effect === "bounce") {
    return visible
      ? { animation: `inv-bounce ${duration} cubic-bezier(.2,.7,.2,1) ${delay} both` }
      : { opacity: 0 };
  }

  if (!visible) {
    const offset = 24;
    const dir = a.direction ?? "up";
    const translate =
      effect === "slide" || effect === "fade" || effect === "reveal"
        ? dir === "up"
          ? `translateY(${offset}px)`
          : dir === "down"
            ? `translateY(-${offset}px)`
            : dir === "left"
              ? `translateX(${offset}px)`
              : `translateX(-${offset}px)`
        : effect === "zoom" || effect === "scale"
          ? "scale(.92)"
          : effect === "rotate"
            ? "rotate(-6deg)"
            : "none";
    return {
      opacity: 0,
      transform: translate,
      transition: `opacity ${duration} ease ${delay}, transform ${duration} cubic-bezier(.2,.7,.2,1) ${delay}`,
    };
  }
  return {
    opacity: 1,
    transform: "none",
    transition: `opacity ${duration} ease ${delay}, transform ${duration} cubic-bezier(.2,.7,.2,1) ${delay}`,
  };
};

