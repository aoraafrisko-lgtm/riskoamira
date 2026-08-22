import { useEffect, useState } from "react";

export interface NavSection {
  id: string;
  name: string;
}

interface Props {
  sections: NavSection[];
  visible: boolean;
  accent?: string;
}

/** Tombol mengapung untuk melompat antar section. */
export function SectionNav({ sections, visible, accent = "#b08d57" }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    if (!visible || !sections.length) return;
    const els = sections
      .map((s) => document.querySelector<HTMLElement>(`[data-section-id="${s.id}"]`))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive((hit.target as HTMLElement).dataset["sectionId"] ?? null);
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections, visible]);

  if (!visible || sections.length < 2) return null;

  const go = (id: string) => {
    document.querySelector<HTMLElement>(`[data-section-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <div style={{ position: "fixed", right: 14, bottom: 18, zIndex: 55, fontFamily: "'Jost', system-ui, sans-serif" }}>
      {open ? (
        <div
          style={{
            marginBottom: 10,
            maxHeight: "58vh",
            overflowY: "auto",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,.16)",
            background: "rgba(16,14,12,.9)",
            backdropFilter: "blur(10px)",
            padding: 6,
            minWidth: 176,
            boxShadow: "0 18px 40px rgba(0,0,0,.45)",
          }}
        >
          {sections.map((s, i) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 11,
                  padding: "9px 11px",
                  fontSize: 12.5,
                  textAlign: "left",
                  color: isActive ? "#fff" : "rgba(255,255,255,.68)",
                  background: isActive ? `${accent}33` : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.55, width: 14 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Navigasi section"
        onClick={() => setOpen((v) => !v)}
        style={{
          height: 48,
          width: 48,
          borderRadius: 999,
          border: `1px solid ${accent}`,
          background: "rgba(16,14,12,.82)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
          boxShadow: "0 10px 26px rgba(0,0,0,.4)",
        }}
      >
        {open ? "✕" : "☰"}
      </button>
    </div>
  );
}
