import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CanvasStage } from "@/components/invitation/CanvasStage";
import { CoverGate } from "@/components/invitation/CoverGate";
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
  const navSections = (hasCover ? visible.slice(1) : visible).map((s) => ({ id: s.id, name: s.name ?? "Section" }));
  const accent = config.theme?.accentColor ?? "#b08d57";
  const locked = hasCover && !opened;

  const open = () => {
    setClosing(true);
    window.setTimeout(() => {
      setOpened(true);
      const next = visible[1];
      if (next) document.querySelector<HTMLElement>(`[data-section-id="${next.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#141210",
        overflow: locked ? "hidden" : "auto",
        height: locked ? "100dvh" : undefined,
      }}
    >
      <h1 className="sr-only">{config.title ?? "Undangan Pernikahan"}</h1>
      <div
        style={{
          opacity: locked ? 0.96 : 1,
          transition: "opacity 1s ease",
        }}
      >
        <CanvasStage fit="viewport">
          <InvitationRenderer
            config={config}
            ctx={{
              editor: false,
              breakpoint: "mobile",
              ...(guest?.name ? { guestName: guest.name } : {}),
              ...(guest?.category ? { guestCategory: guest.category } : {}),
              ...(guest?.greeting ? { guestGreeting: guest.greeting } : {}),
              ...(token ? { token } : {}),
            }}
          />
        </CanvasStage>
      </div>
      <CoverGate
        visible={hasCover && !opened}
        closing={closing}
        accent={accent}
        {...(config.title ? { title: config.title } : {})}
        {...(guest?.name ? { guestName: guest.name } : {})}
        onOpen={open}
      />
      <SectionNav sections={navSections} visible={!locked} accent={accent} />
    </main>
  );
}

