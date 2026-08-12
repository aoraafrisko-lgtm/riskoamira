import { createContext, useContext } from "react";

export interface RenderCtx {
  editor: boolean;
  guestName?: string;
  guestCategory?: string;
  guestGreeting?: string;
  token?: string;
  breakpoint: "desktop" | "tablet" | "mobile";
}

export const RenderContext = createContext<RenderCtx>({ editor: false, breakpoint: "desktop" });
export const useRenderCtx = () => useContext(RenderContext);
