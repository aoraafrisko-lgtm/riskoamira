import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CanvasStage } from "@/components/invitation/CanvasStage";
import { SectionNav } from "@/components/invitation/SectionNav";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { getPublicInvitation } from "@/lib/invitation.functions";
import { emptyConfig, type InvitationConfig } from "@/lib/builder/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Undangan Pernikahan Kami" },
      { name: "description", content: "Dengan penuh sukacita kami mengundang Anda untuk hadir di hari bahagia kami." },
      { property: "og:title", content: "Undangan Pernikahan Kami" },
      { property: "og:description", content: "Dengan penuh sukacita kami mengundang Anda untuk hadir di hari bahagia kami." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicInvitation,
});

function PublicInvitation() {
  const load = useServerFn(getPublicInvitation);
  const [config, setConfig] = useState<InvitationConfig | null>(null);
  const [guest, setGuest] = useState<{ name: string; category: string; greeting: string | null } | null>(null);
  const [opened, setOpened] = useState(false);
  const [closing, setClosing] = useState(false);
  const token = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("guest") ?? undefined;
  }, []);

  useEffect(() => {
    load({ data: token ? { token } : {} })
      .then((raw) => {
        const res = raw as { config: unknown; guest?: { name: string; category: string; greeting: string | null } | null };
        setConfig((res.config as InvitationConfig | null) ?? emptyConfig());
        setGuest(res.guest ?? null);
      })
      .catch(() => setConfig(emptyConfig()));
  }, [load, token]);

  if (!config) return <div style={{ minHeight: "100vh", background: "#fbf8f4" }} />;

  const visible = (config.sections ?? []).filter((s) => !s.hidden);
  const hasCover = visible.length > 1;
  const cover = hasCover ? visible[0] : undefined;
  const rest = hasCover ? visible.slice(1) : visible;
  const navSections = rest.map((s) => ({ id: s.id, name: s.name ?? "Section" }));
  const accent = config.theme?.accentColor ?? "#b08d57";
  const locked = hasCover && !opened;
  const coverHasButton = (cover?.subsections ?? []).some((sub) =>
    (sub.fields ?? []).some((f) => f.type === "open-invitation"),
  );

  const open = () => {
    if (closing || opened) return;
    setClosing(true);
    window.setTimeout(() => {
      setOpened(true);
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 900);
  };

  const baseCtx = {
    editor: false as const,
    breakpoint: "mobile" as const,
    ...(guest?.name ? { guestName: guest.name } : {}),
    ...(guest?.category ? { guestCategory: guest.category } : {}),
    ...(guest?.greeting ? { guestGreeting: guest.greeting } : {}),
    ...(token ? { token } : {}),
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        // Latar gelap letterbox dirender oleh lapisan tetap di belakang (CanvasStage),
        // jadi `main` harus transparan supaya lapisan itu terlihat.
        background: "transparent",
        ...(locked ? { overflow: "hidden", height: "100dvh" } : {}),
      }}
    >

      <h1 className="sr-only">{config.title ?? "Undangan Pernikahan"}</h1>

      {locked && cover ? (
        <div
          style={{
            opacity: closing ? 0 : 1,
            transform: closing ? "scale(1.08)" : "scale(1)",
            transition: "opacity .85s ease, transform 1.1s cubic-bezier(.16,.84,.24,1)",
            pointerEvents: closing ? "none" : "auto",
          }}
        >
          <CanvasStage fit="viewport" theme={config.theme}>
            <InvitationRenderer
              config={{ ...config, sections: [cover] }}
              ctx={{ ...baseCtx, onOpenInvitation: open }}
            />
          </CanvasStage>
          {!coverHasButton ? (
            <button
              type="button"
              onClick={open}
              style={{
                position: "fixed",
                left: "50%",
                bottom: "8vh",
                transform: "translateX(-50%)",
                zIndex: 60,
                padding: "13px 30px",
                borderRadius: 999,
                border: `1px solid ${accent}`,
                background: accent,
                color: "#fff",
                fontSize: 13,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Buka Undangan
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ animation: "inv-open-enter .9s ease both" }}>
          <style>{`@keyframes inv-open-enter { from { opacity:0; transform: translateY(24px) } to { opacity:1; transform:none } }`}</style>
          <CanvasStage fit="viewport" theme={config.theme}>
            <InvitationRenderer config={{ ...config, sections: rest }} ctx={baseCtx} />
          </CanvasStage>
        </div>
      )}

      <SectionNav sections={navSections} visible={!locked} accent={accent} />
    </main>
  );
}

