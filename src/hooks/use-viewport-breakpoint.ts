import { useEffect, useState } from "react";
import type { Breakpoint } from "@/lib/builder/types";

const pick = (w: number): Breakpoint => (w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");

/** Breakpoint aktual dari lebar layar. SSR/first paint = mobile (mobile-first). */
export function useViewportBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("mobile");

  useEffect(() => {
    const update = () => setBp(pick(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return bp;
}
