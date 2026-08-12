import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { getDefinition } from "@/lib/builder/registry";
import type { FieldNode, Photo } from "@/lib/builder/types";
import { animationCss, resolveStyle, styleToCss } from "@/lib/builder/style";
import { useReveal } from "@/lib/builder/use-reveal";
import { useRenderCtx } from "./render-context";
import { submitRsvp, listWishes } from "@/lib/invitation.functions";

const asString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const asNumber = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const asBool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const asPhotos = (v: unknown): Photo[] => (Array.isArray(v) ? (v as Photo[]) : []);
const parseList = (v: unknown) =>
  asString(v)
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter((p) => p[0]);

/* ---------------- individual renderers ---------------- */

function Typing({ text, speed }: { text: string; speed: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? 0 : v + 1)), Math.max(20, speed));
    return () => clearInterval(t);
  }, [text, speed]);
  return (
    <span>
      {text.slice(0, n)}
      <span style={{ opacity: 0.5 }}>|</span>
    </span>
  );
}

function Marquee({ text, speed }: { text: string; speed: number }) {
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-block", animation: `inv-marquee ${speed}s linear infinite` }}>
        {`${text}\u00A0\u00A0\u00A0`.repeat(4)}
      </div>
    </div>
  );
}

function Reveal({ text, mode }: { text: string; mode: string }) {
  const parts = mode === "character" ? [...text] : mode === "word" ? text.split(" ") : text.split("\n");
  return (
    <span>
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            display: mode === "line" ? "block" : "inline-block",
            animation: `inv-fadeup 600ms ease ${i * 60}ms both`,
            whiteSpace: "pre",
          }}
        >
          {p}
          {mode === "word" ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function Slider({
  photos,
  radius,
  minHeight,
  autoplay,
  speed,
  transition,
  navigation,
}: {
  photos: Photo[];
  radius: number;
  minHeight: number;
  autoplay: boolean;
  speed: number;
  transition: string;
  navigation: boolean;
}) {
  const [i, setI] = useState(0);
  const count = photos.length || 1;
  useEffect(() => {
    if (!autoplay || count < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), Math.max(1, speed) * 1000);
    return () => clearInterval(t);
  }, [autoplay, speed, count]);
  if (!photos.length) return <EmptyMedia label="Belum ada foto" />;
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius, minHeight }}>
      {photos.map((p, idx) => (
        <img
          key={p.id}
          src={p.url}
          alt={p.caption ?? ""}
          loading="lazy"
          style={{
            position: idx === 0 ? "relative" : "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minHeight,
            objectFit: "cover",
            opacity: transition === "fade" ? (idx === i ? 1 : 0) : 1,
            transform: transition === "fade" ? "none" : `translateX(${(idx - i) * 100}%)`,
            transition: "opacity .8s ease, transform .6s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      ))}
      {navigation && photos.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Foto ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setI(idx);
              }}
              style={{
                width: idx === i ? 18 : 8,
                height: 8,
                borderRadius: 99,
                background: idx === i ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.5)",
                border: "none",
                cursor: "pointer",
                transition: "all .3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 28,
        border: "1px dashed currentColor",
        opacity: 0.4,
        borderRadius: 12,
        textAlign: "center",
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const cells: [number, string][] = [
    [d, "Hari"],
    [h, "Jam"],
    [m, "Menit"],
    [s, "Detik"],
  ];
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
      {cells.map(([v, l]) => (
        <div
          key={l}
          style={{
            minWidth: 68,
            padding: "12px 10px",
            borderRadius: 12,
            border: "1px solid currentColor",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 26, lineHeight: 1.1 }}>{String(v).padStart(2, "0")}</div>
          <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function CopyRow({ label, value, holder }: { label: string; value: string; holder: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        border: "1px solid currentColor",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 22 }}>{value}</div>
      {holder ? <div style={{ fontSize: 13, opacity: 0.75 }}>a.n. {holder}</div> : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
        style={{
          marginTop: 6,
          padding: "6px 14px",
          borderRadius: 99,
          border: "1px solid currentColor",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        {copied ? "Tersalin!" : "Salin"}
      </button>
    </div>
  );
}

function QrBlock({ data, caption }: { data: string; caption: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(data || " ", { margin: 1, width: 260 })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [data]);
  return (
    <div style={{ textAlign: "center" }}>
      {src ? <img src={src} alt="QR Code" style={{ maxWidth: 220, margin: "0 auto", borderRadius: 12 }} /> : null}
      {caption ? <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>{caption}</div> : null}
    </div>
  );
}

function RsvpForm({ title, note }: { title: string; note: string }) {
  const ctx = useRenderCtx();
  const send = useServerFn(submitRsvp);
  const [name, setName] = useState(ctx.guestName ?? "");
  const [attending, setAttending] = useState(true);
  const [headcount, setHeadcount] = useState(1);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid currentColor",
    background: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: 14,
  } as const;

  if (state === "done")
    return (
      <div style={{ textAlign: "center", padding: 20, border: "1px solid currentColor", borderRadius: 14 }}>
        Terima kasih, konfirmasi Anda sudah kami terima.
      </div>
    );

  return (
    <form
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault();
        if (ctx.editor) {
          setState("done");
          return;
        }
        setState("sending");
        send({ data: { ...(ctx.token ? { token: ctx.token } : {}), name, attending, headcount, message } })
          .then(() => setState("done"))
          .catch(() => setState("error"));
      }}
      style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", maxWidth: 420, margin: "0 auto" }}
    >
      <div style={{ textAlign: "center", fontSize: 20 }}>{title}</div>
      {note ? <div style={{ textAlign: "center", fontSize: 13, opacity: 0.75 }}>{note}</div> : null}
      <input style={inputStyle} placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} required />
      <div style={{ display: "flex", gap: 8 }}>
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setAttending(v)}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: 10,
              border: "1px solid currentColor",
              cursor: "pointer",
              background: attending === v ? "currentColor" : "transparent",
              color: attending === v ? "#fff" : "inherit",
              mixBlendMode: attending === v ? "normal" : "normal",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            {v ? "Hadir" : "Tidak Hadir"}
          </button>
        ))}
      </div>
      <input
        style={inputStyle}
        type="number"
        min={1}
        max={20}
        value={headcount}
        onChange={(e) => setHeadcount(Number(e.target.value))}
      />
      <textarea
        style={{ ...inputStyle, minHeight: 84 }}
        placeholder="Ucapan & doa"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        disabled={state === "sending"}
        style={{
          padding: "11px 16px",
          borderRadius: 99,
          border: "1px solid currentColor",
          background: "currentColor",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
        }}
      >
        <span style={{ filter: "invert(1) grayscale(1) contrast(9)" }}>
          {state === "sending" ? "Mengirim..." : "Kirim Konfirmasi"}
        </span>
      </button>
      {state === "error" ? <div style={{ fontSize: 12 }}>Gagal mengirim, coba lagi.</div> : null}
    </form>
  );
}

function Wishes({ title }: { title: string }) {
  const ctx = useRenderCtx();
  const load = useServerFn(listWishes);
  const [rows, setRows] = useState<{ guest_name: string; message: string | null; created_at: string }[]>([]);
  useEffect(() => {
    if (ctx.editor) return;
    load({})
      .then((d) => setRows(d as never))
      .catch(() => setRows([]));
  }, [ctx.editor, load]);
  const list = ctx.editor
    ? [{ guest_name: "Contoh Tamu", message: "Selamat berbahagia!", created_at: new Date().toISOString() }]
    : rows;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ textAlign: "center", fontSize: 20 }}>{title}</div>
      {list.length === 0 ? <div style={{ textAlign: "center", opacity: 0.6, fontSize: 13 }}>Belum ada ucapan.</div> : null}
      {list.map((r, i) => (
        <div key={i} style={{ border: "1px solid currentColor", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 14 }}>{r.guest_name}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{r.message}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- main dispatcher ---------------- */

export function FieldRenderer({ field }: { field: FieldNode }) {
  const ctx = useRenderCtx();
  const def = getDefinition(field.type);
  const style = useMemo(() => resolveStyle(field, ctx.breakpoint), [field, ctx.breakpoint]);
  const { ref, visible } = useReveal<HTMLDivElement>(field.animation?.trigger === "scroll");
  const c = field.content;
  const b = field.behavior;
  const radius = style.radius ?? 0;
  const kind = def?.render ?? "text";
  const gridCols = Math.max(1, asNumber(b["columns"], 3));
  const cols = ctx.breakpoint === "mobile" ? Math.min(gridCols, 2) : gridCols;

  let body: React.ReactNode = null;

  switch (kind) {
    case "heading":
      body = <div>{asString(c["text"], "Heading")}</div>;
      break;
    case "text":
      body = (
        <div style={{ whiteSpace: "pre-wrap" }}>
          {asString(c["text"]).replaceAll("{{guest}}", ctx.guestName ?? "Tamu Undangan")}
        </div>
      );
      break;
    case "richtext":
      body = <div dangerouslySetInnerHTML={{ __html: asString(c["html"]) }} />;
      break;
    case "quote":
      body = (
        <blockquote style={{ margin: 0, fontStyle: "italic" }}>
          <div>&ldquo;{asString(c["text"])}&rdquo;</div>
          {asString(c["source"]) ? (
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8, fontStyle: "normal" }}>
              — {asString(c["source"])}
            </div>
          ) : null}
        </blockquote>
      );
      break;
    case "typing":
      body = <Typing text={asString(c["text"])} speed={asNumber(c["speed"], 110)} />;
      break;
    case "marquee":
      body = <Marquee text={asString(c["text"])} speed={asNumber(c["speed"], 20)} />;
      break;
    case "reveal":
      body = <Reveal text={asString(c["text"])} mode={asString(c["mode"], "word")} />;
      break;
    case "image": {
      const url = asString(c["url"]);
      body = url ? (
        <figure style={{ margin: 0 }}>
          <img
            src={url}
            alt={asString(c["caption"], "Foto")}
            loading="lazy"
            style={{
              width: "100%",
              borderRadius: radius,
              display: "block",
              objectFit: "cover",
              minHeight: style.minHeight,
              animation: field.type === "kenburns" ? "inv-kenburns 12s ease-in-out infinite alternate" : undefined,
            }}
          />
          {asString(c["caption"]) ? (
            <figcaption style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{asString(c["caption"])}</figcaption>
          ) : null}
        </figure>
      ) : (
        <EmptyMedia label="Belum ada gambar" />
      );
      break;
    }
    case "slider":
    case "carousel":
      body = (
        <Slider
          photos={asPhotos(c["photos"])}
          radius={radius || 12}
          minHeight={style.minHeight ?? 300}
          autoplay={asBool(b["autoplay"], true)}
          speed={asNumber(b["speed"], 3)}
          transition={asString(b["transition"], "fade")}
          navigation={asBool(b["navigation"], true)}
        />
      );
      break;
    case "grid":
      body = (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {asPhotos(c["photos"]).map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt={p.caption ?? "Foto"}
              loading="lazy"
              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: radius || 8 }}
            />
          ))}
        </div>
      );
      break;
    case "masonry":
      body = (
        <div style={{ columnCount: cols, columnGap: 8 }}>
          {asPhotos(c["photos"]).map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt={p.caption ?? "Foto"}
              loading="lazy"
              style={{ width: "100%", marginBottom: 8, borderRadius: radius || 8, display: "block" }}
            />
          ))}
        </div>
      );
      break;
    case "polaroid":
      body = (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
          {asPhotos(c["photos"]).map((p, i) => (
            <div
              key={p.id}
              style={{
                background: "#fff",
                padding: "10px 10px 30px",
                boxShadow: "0 10px 24px rgba(0,0,0,.15)",
                transform: `rotate(${i % 2 ? 2.5 : -2.5}deg)`,
              }}
            >
              <img src={p.url} alt={p.caption ?? "Foto"} loading="lazy" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      );
      break;
    case "stack":
      body = (
        <div style={{ position: "relative", minHeight: style.minHeight ?? 280 }}>
          {asPhotos(c["photos"]).map((p, i) => (
            <img
              key={p.id}
              src={p.url}
              alt={p.caption ?? "Foto"}
              loading="lazy"
              style={{
                position: "absolute",
                left: `${8 + i * 12}%`,
                top: i * 16,
                width: "58%",
                aspectRatio: "3/4",
                objectFit: "cover",
                borderRadius: radius || 10,
                boxShadow: "0 14px 30px rgba(0,0,0,.18)",
                transform: `rotate(${(i % 3) * 4 - 4}deg)`,
              }}
            />
          ))}
        </div>
      );
      break;
    case "circular":
      body = (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {asPhotos(c["photos"]).map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt={p.caption ?? "Foto"}
              loading="lazy"
              style={{ width: 120, height: 120, borderRadius: 999, objectFit: "cover" }}
            />
          ))}
        </div>
      );
      break;
    case "beforeafter":
      body = (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[asString(c["before"]), asString(c["after"])].map((u, i) => (
            <img key={i} src={u} alt={i ? "Sesudah" : "Sebelum"} loading="lazy" style={{ width: "100%", borderRadius: radius || 8, objectFit: "cover" }} />
          ))}
        </div>
      );
      break;
    case "background":
      body = (
        <div
          style={{
            position: "relative",
            minHeight: style.minHeight ?? 320,
            borderRadius: radius,
            overflow: "hidden",
            backgroundImage: `url(${asString(c["url"])})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: field.type === "parallax-image" ? "fixed" : undefined,
          }}
        >
          {style.overlay ? (
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(style.overlay ?? 0) / 100})` }} />
          ) : null}
        </div>
      );
      break;
    case "video": {
      const url = asString(c["url"]);
      body = url ? (
        <video
          src={url}
          autoPlay={asBool(b["autoplay"])}
          loop={asBool(b["loop"])}
          muted={asBool(b["muted"], true)}
          controls={asBool(b["controls"], true)}
          playsInline
          style={{ width: "100%", borderRadius: radius || 12, minHeight: style.minHeight }}
        />
      ) : (
        <EmptyMedia label="Tambahkan URL video" />
      );
      break;
    }
    case "embedvideo": {
      const raw = asString(c["url"]);
      const yt = raw.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
      const vimeo = raw.match(/vimeo\.com\/(\d+)/);
      const src = yt ? `https://www.youtube.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : "";
      body = src ? (
        <iframe
          src={src}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: radius || 12 }}
        />
      ) : (
        <EmptyMedia label="Tambahkan URL video" />
      );
      break;
    }
    case "audio": {
      const url = asString(c["url"]);
      body = (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>{asString(c["title"])}</div>
          {url ? (
            <audio src={url} controls loop={asBool(b["loop"], true)} style={{ width: "100%" }} />
          ) : (
            <EmptyMedia label="Tambahkan URL audio" />
          )}
        </div>
      );
      break;
    }
    case "couple":
      body = (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: ctx.breakpoint === "mobile" ? "1fr" : "1fr auto 1fr",
            gap: 18,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Person name={asString(c["groom"])} parents={asString(c["groomParents"])} photo={asString(c["groomPhoto"])} />
          <div style={{ fontSize: 30, opacity: 0.6 }}>&amp;</div>
          <Person name={asString(c["bride"])} parents={asString(c["brideParents"])} photo={asString(c["bridePhoto"])} />
        </div>
      );
      break;
    case "person":
      body = (
        <Person
          name={asString(c["name"])}
          parents={asString(c["parents"])}
          photo={asString(c["photo"])}
          instagram={asString(c["instagram"])}
        />
      );
      break;
    case "date": {
      const d = new Date(asString(c["date"], "2026-12-12"));
      const valid = !Number.isNaN(d.getTime());
      body = (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, lineHeight: 1.1 }}>{valid ? d.getDate() : "--"}</div>
          <div style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase" }}>
            {valid ? d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : ""}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {valid ? d.toLocaleDateString("id-ID", { weekday: "long" }) : ""}
          </div>
        </div>
      );
      break;
    }
    case "countdown":
      body = <Countdown target={asString(c["date"], "2026-12-12T08:00")} />;
      break;
    case "event":
      body = (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8 }}>
            {asString(c["title"])}
          </div>
          <div style={{ fontSize: 20 }}>{asString(c["date"])}</div>
          <div style={{ fontSize: 15 }}>{asString(c["time"])}</div>
          <div style={{ fontSize: 16, marginTop: 6 }}>{asString(c["place"])}</div>
          <div style={{ fontSize: 13, opacity: 0.75, whiteSpace: "pre-wrap" }}>{asString(c["address"])}</div>
          {asString(c["mapUrl"]) ? (
            <a
              href={asString(c["mapUrl"])}
              target="_blank"
              rel="noreferrer"
              style={{
                alignSelf: "center",
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 99,
                border: "1px solid currentColor",
                fontSize: 13,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Lihat Lokasi
            </a>
          ) : null}
        </div>
      );
      break;
    case "story":
    case "timeline":
      body = (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {parseList(c["items"]).map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 12, textAlign: "left" }}>
              <div style={{ fontSize: 13, opacity: 0.7, paddingTop: 3 }}>{row[0]}</div>
              <div style={{ borderLeft: "1px solid currentColor", paddingLeft: 14 }}>
                <div style={{ fontSize: 16 }}>{row[1]}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>{row[2]}</div>
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case "location":
      body = (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18 }}>{asString(c["place"])}</div>
          <div style={{ fontSize: 13, opacity: 0.75, whiteSpace: "pre-wrap" }}>{asString(c["address"])}</div>
          {asString(c["mapUrl"]) ? (
            <a href={asString(c["mapUrl"])} target="_blank" rel="noreferrer" style={{ color: "inherit", fontSize: 13 }}>
              Buka di Maps
            </a>
          ) : null}
        </div>
      );
      break;
    case "map":
      body = (
        <iframe
          title="Peta"
          src={`https://www.google.com/maps?q=${encodeURIComponent(asString(c["query"], "Jakarta"))}&output=embed`}
          style={{ width: "100%", minHeight: style.minHeight ?? 260, border: 0, borderRadius: radius || 12 }}
        />
      );
      break;
    case "button": {
      const variant = asString(b["variant"], "solid");
      body = (
        <a
          href={asString(c["url"], "#")}
          target={asBool(b["newTab"]) ? "_blank" : undefined}
          rel="noreferrer"
          style={{
            display: asBool(b["fullWidth"]) ? "block" : "inline-block",
            textAlign: "center",
            padding: "11px 22px",
            borderRadius: 99,
            fontSize: 14,
            textDecoration: "none",
            border: variant === "ghost" ? "none" : "1px solid currentColor",
            background: variant === "solid" ? "currentColor" : "transparent",
            color: "inherit",
          }}
        >
          <span style={variant === "solid" ? { filter: "invert(1) grayscale(1) contrast(9)" } : undefined}>
            {asString(c["label"], "Tombol")}
          </span>
        </a>
      );
      break;
    }
    case "social":
      body = (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {parseList(c["items"]).map((row, i) => (
            <a
              key={i}
              href={row[1] ?? "#"}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: "1px solid currentColor",
                fontSize: 13,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {row[0]}
            </a>
          ))}
        </div>
      );
      break;
    case "guestname":
      body = (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          {asString(c["prefix"]) ? <div style={{ fontSize: 13, opacity: 0.75 }}>{asString(c["prefix"])}</div> : null}
          <div style={{ fontSize: 24 }}>{ctx.guestName ?? "Tamu Undangan"}</div>
          {asBool(c["showCategory"]) && ctx.guestCategory ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>{ctx.guestCategory}</div>
          ) : null}
          {asString(c["suffix"]) ? <div style={{ fontSize: 13, opacity: 0.75 }}>{asString(c["suffix"])}</div> : null}
        </div>
      );
      break;
    case "rsvp":
      body = <RsvpForm title={asString(c["title"], "Konfirmasi Kehadiran")} note={asString(c["note"])} />;
      break;
    case "wishes":
      body = <Wishes title={asString(c["title"], "Ucapan & Doa")} />;
      break;
    case "bank":
      body = <CopyRow label={asString(c["bank"])} value={asString(c["number"])} holder={asString(c["holder"])} />;
      break;
    case "qrcode":
      body = <QrBlock data={asString(c["data"])} caption={asString(c["caption"])} />;
      break;
    case "divider": {
      const v = asString(c["variant"], "line");
      body =
        v === "dots" ? (
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: 99, background: "currentColor", opacity: 0.6 }} />
            ))}
          </div>
        ) : v === "ornament" ? (
          <div style={{ textAlign: "center", opacity: 0.6, letterSpacing: 6 }}>❦ ❧ ❦</div>
        ) : (
          <div style={{ height: 1, background: "currentColor", opacity: 0.3 }} />
        );
      break;
    }
    case "spacer":
      body = <div style={{ height: asNumber(c["height"], 40) }} />;
      break;
    case "icon": {
      const glyphs: Record<string, string> = { heart: "♥", flower: "❀", ring: "◎", star: "✦", leaf: "❧" };
      body = (
        <div
          style={{
            textAlign: "center",
            fontSize: asNumber(c["size"], 32),
            animation: field.type === "floating-element" ? "inv-float 3s ease-in-out infinite alternate" : undefined,
          }}
        >
          {glyphs[asString(c["name"], "heart")] ?? "♥"}
        </div>
      );
      break;
    }
    case "shape": {
      const v = asString(c["variant"], "circle");
      const size = asNumber(c["size"], 60);
      body = (
        <div
          style={{
            width: v === "line" ? size : size,
            height: v === "line" ? 1 : size,
            borderRadius: v === "circle" ? 999 : v === "line" ? 0 : radius,
            background: style.bgColor ?? "currentColor",
            margin: "0 auto",
            opacity: style.opacity ?? 0.8,
          }}
        />
      );
      break;
    }
    case "particles": {
      const variant = asString(c["variant"], "confetti");
      const glyph = variant === "sparkle" ? "✦" : variant === "petal" ? "❀" : "●";
      const count = Math.min(80, asNumber(c["count"], 30));
      body = (
        <div style={{ position: "relative", height: style.minHeight ?? 120, overflow: "hidden" }}>
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${(i * 37) % 100}%`,
                top: `-10%`,
                fontSize: 8 + ((i * 7) % 12),
                opacity: 0.7,
                animation: `inv-fall ${5 + (i % 6)}s linear ${(i % 10) * 0.4}s infinite`,
              }}
            >
              {glyph}
            </span>
          ))}
        </div>
      );
      break;
    }
    case "html":
      body = <div dangerouslySetInnerHTML={{ __html: asString(c["html"]) }} />;
      break;
    default:
      body = <div>{asString(c["text"], def?.name ?? field.type)}</div>;
  }

  return (
    <div
      ref={ref}
      data-field-id={field.id}
      style={{
        ...styleToCss(style),
        ...animationCss(field.animation, visible),
        ...(field.hidden ? { display: "none" } : {}),
      }}
    >
      {body}
    </div>
  );
}

function Person({
  name,
  parents,
  photo,
  instagram,
}: {
  name: string;
  parents: string;
  photo: string;
  instagram?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      {photo ? (
        <img
          src={photo}
          alt={name}
          loading="lazy"
          style={{ width: 132, height: 132, borderRadius: 999, objectFit: "cover", margin: "0 auto 12px" }}
        />
      ) : null}
      <div style={{ fontSize: 24 }}>{name}</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{parents}</div>
      {instagram ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>@{instagram.replace("@", "")}</div> : null}
    </div>
  );
}
