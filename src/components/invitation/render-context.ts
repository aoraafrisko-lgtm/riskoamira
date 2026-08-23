import { createContext, useContext } from "react";

export interface RenderCtx {
  editor: boolean;
  guestName?: string;
  guestCategory?: string;
  guestGreeting?: string;
  token?: string;
  breakpoint: "desktop" | "tablet" | "mobile";
  /** Dipanggil tombol "Buka Undangan" pada cover (Section 1). */
  onOpenInvitation?: () => void;
}

export const RenderContext = createContext<RenderCtx>({ editor: false, breakpoint: "desktop" });
export const useRenderCtx = () => useContext(RenderContext);
