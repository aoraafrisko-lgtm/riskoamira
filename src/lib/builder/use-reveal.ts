import { useEffect, useRef, useState } from "react";

interface RevealOptions {
  /** true = animasi hanya sekali; false = ulang tiap kali elemen masuk viewport lagi */
  once?: boolean;
  /** naikkan nilainya untuk memutar ulang animasi (pratinjau di editor) */
  replayNonce?: number;
}

export function useReveal<T extends HTMLElement>(enabled = true, opts: RevealOptions = {}) {
  const { once = true, replayNonce = 0 } = opts;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible(true);
          else if (!once) setVisible(false);
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, once]);

  // Putar ulang animasi ketika nonce berubah
  useEffect(() => {
    if (!replayNonce) return;
    setVisible(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [replayNonce]);

  return { ref, visible };
}
