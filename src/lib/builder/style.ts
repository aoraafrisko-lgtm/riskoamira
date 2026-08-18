import type { CSSProperties } from "react";
import type { AnimationConfig, Breakpoint, FieldNode, StyleConfig } from "./types";

export const mergeStyle = (base: StyleConfig, override?: StyleConfig): StyleConfig => ({
  ...base,
  ...(override ?? {}),
});

export const resolveStyle = (node: FieldNode, bp: Breakpoint): StyleConfig =>
  mergeStyle(node.style, node.responsive?.[bp]);

/**
 * Penyesuaian otomatis untuk layar HP: padding tidak menempel tepi,
 * heading besar dikecilkan, dan lebar tetap dibuat fleksibel.
 */
export const scaleStyle = (s: StyleConfig, bp: Breakpoint): StyleConfig => {
  if (bp === "desktop") return s;
  const f = bp === "mobile" ? 0.72 : 0.88;
  const out: StyleConfig = { ...s };
  if (s.fontSize !== undefined) {
    out.fontSize = s.fontSize > 20 ? Math.max(18, Math.round(s.fontSize * f)) : s.fontSize;
  }
  if (s.paddingY !== undefined) out.paddingY = Math.round(s.paddingY * f);
  if (s.paddingX !== undefined) {
    out.paddingX = bp === "mobile" ? Math.min(s.paddingX, 20) : Math.round(s.paddingX * f);
  }
  if (bp === "mobile") {
    if (out.paddingX === undefined) out.paddingX = 20;
    if (s.marginTop !== undefined) out.marginTop = Math.round(s.marginTop * f);
    if (s.marginBottom !== undefined) out.marginBottom = Math.round(s.marginBottom * f);
    if (s.width && /px$/.test(s.width)) out.width = "100%";
    if (s.letterSpacing !== undefined && s.letterSpacing > 3) out.letterSpacing = 3;
  }
  return out;
};

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

export const styleToCss = (s: StyleConfig = {}): CSSProperties => {
  const css: CSSProperties = {};
  if (s.bgGradient) css.backgroundImage = s.bgGradient;
  if (s.bgColor) css.backgroundColor = s.bgColor;
  if (s.textColor) css.color = s.textColor;
  if (s.fontFamily) css.fontFamily = s.fontFamily;
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

export const animationCss = (a: AnimationConfig = {}, visible = true): CSSProperties => {
  const effect = a.effect ?? "none";
  if (effect === "none") return {};
  const duration = `${a.duration ?? 700}ms`;
  const delay = `${a.delay ?? 0}ms`;
  const loop = a.repeat === "loop";
  if (loop || ["float", "pulse", "kenburns"].includes(effect)) {
    return {
      animation: `inv-${effect} ${duration} ease-in-out ${delay} infinite alternate`,
    };
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
