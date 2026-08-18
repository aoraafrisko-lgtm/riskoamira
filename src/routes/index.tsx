import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { useViewportBreakpoint } from "@/hooks/use-viewport-breakpoint";
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

  return (
    <main>
      <h1 className="sr-only">{config.title ?? "Undangan Pernikahan"}</h1>
      <InvitationRenderer
        config={config}
        ctx={{
          editor: false,
          breakpoint: "desktop",
          ...(guest?.name ? { guestName: guest.name } : {}),
          ...(guest?.category ? { guestCategory: guest.category } : {}),
          ...(guest?.greeting ? { guestGreeting: guest.greeting } : {}),
          ...(token ? { token } : {}),
        }}
      />
    </main>
  );
}
