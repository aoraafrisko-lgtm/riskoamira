import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/builder/canvas";
import { bgLayerStyle } from "@/lib/builder/style";
import type { InvitationConfig } from "@/lib/builder/types";

interface Props {
  children: React.ReactNode;
  /** "viewport" = skala ikut tinggi jendela (undangan publik), "container" = ikut tinggi wadah (editor). */
  fit?: "viewport" | "container";
  /** Tema undangan; latar dasarnya dirender sebagai lapisan diam di belakang semua section. */
  theme?: InvitationConfig["theme"];
  className?: string;
}

/**
 * Membungkus kanvas 1080×1920 dan menskalakannya agar pas di layar apa pun.
 * Lebar logis selalu 1080px sehingga tampilan HP dan desktop identik.
 * Latar dasar tema dipasang sticky (diam saat scroll) berukuran tepat satu section.
 */
export function CanvasStage({ children, fit = "viewport", theme, className }: Props) {
  const holder = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.36);
  const [innerHeight, setInnerHeight] = useState(CANVAS_HEIGHT);
  const [stageHeight, setStageHeight] = useState(CANVAS_HEIGHT * 0.36);

  useEffect(() => {
    const calc = () => {
      const el = holder.current;
      if (!el) return;
      const w = el.clientWidth || window.innerWidth;
      const h = fit === "container" ? el.clientHeight || window.innerHeight : window.innerHeight;
      const next = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);
      setScale(next > 0 ? next : 0.36);
      setStageHeight(h > 0 ? h : CANVAS_HEIGHT * 0.36);
      if (inner.current) setInnerHeight(inner.current.scrollHeight || CANVAS_HEIGHT);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (holder.current) ro.observe(holder.current);
    if (inner.current) ro.observe(inner.current);
    window.addEventListener("resize", calc);
    window.addEventListener("orientationchange", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
      window.removeEventListener("orientationchange", calc);
    };
  }, [fit]);

  const hasBg = !!(theme?.bgColor || theme?.bgImage || theme?.bgGradient);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Latar dasar diskalakan "cover" supaya selalu mengisi penuh tinggi layar/frame
  // (tanpa pita hitam di layar yang lebih tinggi dari rasio 1080×1920).
  const layerScale = Math.max(scale, stageHeight / CANVAS_HEIGHT);

  const layer = hasBg ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Mode viewport: lapisan diportal ke <body>, jadi harus di belakang konten `main`.
        zIndex: fit === "container" ? 0 : -1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden
    >
      <div
        style={{
          position: "relative",
          width: CANVAS_WIDTH * layerScale,
          height: CANVAS_HEIGHT * layerScale,
          flex: "0 0 auto",
          overflow: "hidden",
          background: theme?.bgColor ?? undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${layerScale})`,
            transformOrigin: "top left",
          }}
        >
          {theme?.bgImage || theme?.bgGradient ? <div style={bgLayerStyle(theme)} /> : null}
          {theme?.overlay ? (
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${theme.overlay / 100})` }} />
          ) : null}
        </div>
      </div>
    </div>
  ) : null;



  return (
    <div ref={holder} className={className} style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Mode viewport: lapisan latar diportal ke <body> agar `fixed` benar-benar
          mengacu ke layar (tidak terpengaruh transform/animasi ancestor). */}
      {layer
        ? fit === "container"
          ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  overflow: "hidden",
                  transform: "translateZ(0)",
                }}
              >
                {layer}
              </div>
            )
          : mounted
            ? createPortal(layer, document.body)
            : null
        : null}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: CANVAS_WIDTH * scale,
          height: innerHeight * scale,
          margin: "0 auto",
        }}
      >
        <div
          ref={inner}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
