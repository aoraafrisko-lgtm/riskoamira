import { useEffect, useRef, useState } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/builder/canvas";

interface Props {
  children: React.ReactNode;
  /** "viewport" = skala ikut tinggi jendela (undangan publik), "container" = ikut tinggi wadah (editor). */
  fit?: "viewport" | "container";
  className?: string;
}

/**
 * Membungkus kanvas 1080×1920 dan menskalakannya agar pas di layar apa pun.
 * Lebar logis selalu 1080px sehingga tampilan HP dan desktop identik.
 */
export function CanvasStage({ children, fit = "viewport", className }: Props) {
  const holder = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.36);
  const [innerHeight, setInnerHeight] = useState(CANVAS_HEIGHT);

  useEffect(() => {
    const calc = () => {
      const el = holder.current;
      if (!el) return;
      const w = el.clientWidth || window.innerWidth;
      const h = fit === "container" ? el.clientHeight || window.innerHeight : window.innerHeight;
      const next = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);
      setScale(next > 0 ? next : 0.36);
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

  return (
    <div ref={holder} className={className} style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          position: "relative",
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
