import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deleteMedia, listMedia, uploadMedia, type MediaItem } from "@/lib/invitation.functions";
import { FONT_GROUPS, ensureFontLoaded, fontNameFromCss } from "@/lib/builder/fonts";
import type { BgConfig } from "@/lib/builder/types";

/* ----------------------------- helpers ----------------------------- */

const sha256Hex = async (buf: ArrayBuffer) => {
  if (!globalThis.crypto?.subtle) return undefined;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
};

export function useUpload(code: string) {
  const upload = useServerFn(uploadMedia);
  return useCallback(
    async (file: File | Blob, fileName?: string) => {
      const buf = await file.arrayBuffer();
      const hash = await sha256Hex(buf);
      const res = await upload({
        data: {
          code,
          fileName: fileName ?? (file as File).name ?? "upload.png",
          base64: toBase64(buf),
          contentType: file.type || "image/png",
          hash,
        },
      });
      if (res.reused) toast.success("Memakai file yang sudah ada (hemat penyimpanan)");
      return res.url;
    },
    [code, upload],
  );
}

const CHECKER =
  "repeating-conic-gradient(#e9e9e9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px";

/* --------------------------- Media library --------------------------- */

export function MediaLibraryDialog({
  open,
  onOpenChange,
  code,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  code: string;
  onPick: (urls: string[]) => void;
}) {
  const list = useServerFn(listMedia);
  const del = useServerFn(deleteMedia);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    list({ data: { code } })
      .then((rows) => setItems(rows))
      .catch(() => toast.error("Gagal memuat pustaka media"))
      .finally(() => setLoading(false));
  }, [code, list]);

  useEffect(() => {
    if (open) {
      setPicked([]);
      refresh();
    }
  }, [open, refresh]);

  const filtered = items.filter(
    (m) =>
      (kind === "all" || m.kind === kind) &&
      (q.trim() === "" || (m.label ?? "").toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pustaka Media</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 flex-1 text-xs" placeholder="Cari nama file..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select
            className="h-8 rounded-md border bg-background px-2 text-xs"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">Semua</option>
            <option value="image">Gambar</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
          </select>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={refresh}>
            Muat ulang
          </Button>
        </div>
        <ScrollArea className="h-[52vh] pr-2">
          {loading ? (
            <p className="p-4 text-xs text-muted-foreground">Memuat...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Belum ada media. Upload dulu dari kolom gambar.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {filtered.map((m) => {
                const sel = picked.includes(m.url);
                return (
                  <div
                    key={m.id}
                    className={`group relative overflow-hidden rounded-md border ${sel ? "ring-2 ring-primary" : ""}`}
                  >
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => setPicked((p) => (sel ? p.filter((u) => u !== m.url) : [...p, m.url]))}
                    >
                      {m.kind === "image" ? (
                        <img src={m.url} alt={m.label ?? ""} className="h-24 w-full object-cover" style={{ background: CHECKER }} />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-muted text-[11px]">{m.kind}</div>
                      )}
                      <div className="truncate px-1 py-1 text-[10px] text-muted-foreground">{m.label}</div>
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded bg-destructive px-1 text-[10px] text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                      onClick={() =>
                        del({ data: { code, id: m.id } })
                          .then(() => setItems((prev) => prev.filter((x) => x.id !== m.id)))
                          .catch(() => toast.error("Gagal menghapus"))
                      }
                    >
                      Hapus
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-[11px] text-muted-foreground">{picked.length} dipilih</span>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={picked.length === 0}
            onClick={() => {
              onPick(picked);
              onOpenChange(false);
            }}
          >
            Pakai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Background remover --------------------------- */

interface BorderOpts {
  width: number;
  color: string;
  feather: number;
  shadow: boolean;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });

export function BgRemoverDialog({
  open,
  onOpenChange,
  src,
  code,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string;
  code: string;
  onDone: (url: string) => void;
}) {
  const upload = useUpload(code);
  const originalRef = useRef<HTMLImageElement | null>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const undoRef = useRef<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving">("idle");
  const [tool, setTool] = useState<"erase" | "restore">("erase");
  const [brush, setBrush] = useState(40);
  const [border, setBorder] = useState<BorderOpts>({ width: 0, color: "#ffffff", feather: 0, shadow: false });

  const paintView = useCallback(() => {
    const work = workRef.current;
    const view = viewRef.current;
    if (!work || !view) return;
    view.width = work.width;
    view.height = work.height;
    const ctx = view.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, view.width, view.height);
    drawWithBorder(ctx, work, border);
  }, [border]);

  // Jalankan penghapusan latar otomatis saat dialog dibuka
  useEffect(() => {
    if (!open || !src) return;
    let cancelled = false;
    setStatus("loading");
    undoRef.current = [];
    (async () => {
      try {
        const original = await loadImage(src);
        if (cancelled) return;
        originalRef.current = original;
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(src);
        if (cancelled) return;
        const cutUrl = URL.createObjectURL(blob);
        const cut = await loadImage(cutUrl);
        const canvas = document.createElement("canvas");
        canvas.width = original.naturalWidth;
        canvas.height = original.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(cut, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(cutUrl);
        workRef.current = canvas;
        setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Gagal menghapus latar");
          setStatus("idle");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, src]);

  useEffect(() => {
    if (status === "ready") paintView();
  }, [status, paintView]);

  const pushUndo = () => {
    const work = workRef.current;
    if (!work) return;
    undoRef.current.push(work.toDataURL("image/png"));
    if (undoRef.current.length > 8) undoRef.current.shift();
  };

  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const work = workRef.current;
    const view = viewRef.current;
    const original = originalRef.current;
    if (!work || !view || !original) return;
    const rect = view.getBoundingClientRect();
    const scale = work.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const r = (brush * scale) / 2;
    const ctx = work.getContext("2d");
    if (!ctx) return;
    if (tool === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(original, 0, 0, work.width, work.height);
      ctx.restore();
    }
    paintView();
  };

  const [drawing, setDrawing] = useState(false);

  const save = async () => {
    const work = workRef.current;
    if (!work) return;
    setStatus("saving");
    try {
      const out = document.createElement("canvas");
      out.width = work.width;
      out.height = work.height;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak tersedia");
      drawWithBorder(ctx, work, border);
      const blob = await new Promise<Blob | null>((res) => out.toBlob(res, "image/png"));
      if (!blob) throw new Error("Gagal membuat PNG");
      const url = await upload(blob, `nobg_${Date.now()}.png`);
      onDone(url);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setStatus("ready");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Hapus Latar Gambar</DialogTitle>
        </DialogHeader>
        {status === "loading" ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Memproses di perangkat Anda... (unduh model pertama kali bisa beberapa detik)
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Asli</Label>
            <img src={src} alt="" className="mt-1 max-h-52 w-full rounded border object-contain" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Hasil</Label>
            <canvas
              ref={viewRef}
              className="mt-1 max-h-52 w-full rounded border object-contain"
              style={{ background: CHECKER, touchAction: "none", cursor: "crosshair" }}
              onPointerDown={(e) => {
                if (status !== "ready") return;
                pushUndo();
                setDrawing(true);
                paintAt(e);
              }}
              onPointerMove={(e) => drawing && paintAt(e)}
              onPointerUp={() => setDrawing(false)}
              onPointerLeave={() => setDrawing(false)}
            />
          </div>
        </div>

        {status === "ready" || status === "saving" ? (
          <div className="space-y-3">
            <div className="rounded-md border p-2">
              <div className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Koreksi manual</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={tool === "erase" ? "default" : "outline"} className="h-7 text-[11px]" onClick={() => setTool("erase")}>
                  Kuas Hapus
                </Button>
                <Button size="sm" variant={tool === "restore" ? "default" : "outline"} className="h-7 text-[11px]" onClick={() => setTool("restore")}>
                  Kuas Pulihkan
                </Button>
                <label className="flex items-center gap-1 text-[11px]">
                  Ukuran
                  <input type="range" min={5} max={160} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={async () => {
                    const snap = undoRef.current.pop();
                    const work = workRef.current;
                    if (!snap || !work) return;
                    const img = await loadImage(snap);
                    const ctx = work.getContext("2d");
                    ctx?.clearRect(0, 0, work.width, work.height);
                    ctx?.drawImage(img, 0, 0);
                    paintView();
                  }}
                >
                  Undo
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Sapukan di gambar hasil untuk merapikan sisa latar atau memulihkan bagian yang terpotong.
              </p>
            </div>

            <div className="rounded-md border p-2">
              <div className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Garis tepi (border)</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px]">
                  Tebal ({border.width}px)
                  <input
                    className="w-full"
                    type="range"
                    min={0}
                    max={40}
                    value={border.width}
                    onChange={(e) => setBorder((b) => ({ ...b, width: Number(e.target.value) }))}
                  />
                </label>
                <label className="text-[11px]">
                  Halus ({border.feather}px)
                  <input
                    className="w-full"
                    type="range"
                    min={0}
                    max={20}
                    value={border.feather}
                    onChange={(e) => setBorder((b) => ({ ...b, feather: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px]">
                  Warna
                  <input
                    type="color"
                    className="h-7 w-10 rounded border"
                    value={border.color}
                    onChange={(e) => setBorder((b) => ({ ...b, color: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={border.shadow}
                    onChange={(e) => setBorder((b) => ({ ...b, shadow: e.target.checked }))}
                  />
                  Bayangan halus
                </label>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" disabled={status !== "ready"} onClick={save}>
            {status === "saving" ? "Menyimpan..." : "Pakai"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Gambar hasil potong + garis tepi mengikuti bentuk objek (dilatasi masker alpha). */
function drawWithBorder(ctx: CanvasRenderingContext2D, work: HTMLCanvasElement, border: BorderOpts) {
  const { width, height } = work;
  ctx.clearRect(0, 0, width, height);
  if (border.width > 0) {
    // silhouette berwarna
    const sil = document.createElement("canvas");
    sil.width = width;
    sil.height = height;
    const sctx = sil.getContext("2d");
    if (sctx) {
      sctx.drawImage(work, 0, 0);
      sctx.globalCompositeOperation = "source-in";
      sctx.fillStyle = border.color;
      sctx.fillRect(0, 0, width, height);
    }
    ctx.save();
    if (border.feather > 0) ctx.filter = `blur(${border.feather}px)`;
    if (border.shadow) {
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = border.width * 1.5;
    }
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      ctx.drawImage(sil, Math.cos(a) * border.width, Math.sin(a) * border.width);
    }
    ctx.restore();
  }
  ctx.drawImage(work, 0, 0);
}

/* ------------------------------ Image input ------------------------------ */

export function ImageInput({
  label,
  value,
  onChange,
  code,
  accept = "image/*,video/*,audio/*",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  code: string;
  accept?: string;
}) {
  const upload = useUpload(code);
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState(false);
  const [nobg, setNobg] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-xs" placeholder="Tempel URL gambar" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Mengunggah..." : "Upload"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setLib(true)}>
          Pustaka
        </Button>
        {value ? (
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setNobg(true)}>
            Hapus Latar
          </Button>
        ) : null}
        {value ? (
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => onChange("")}>
            Kosongkan
          </Button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          upload(file)
            .then(onChange)
            .catch(() => toast.error("Upload gagal"))
            .finally(() => {
              setBusy(false);
              if (fileRef.current) fileRef.current.value = "";
            });
        }}
      />
      {value ? <img src={value} alt="" className="h-16 w-full rounded object-cover" style={{ background: CHECKER }} /> : null}
      <MediaLibraryDialog open={lib} onOpenChange={setLib} code={code} onPick={(urls) => urls[0] && onChange(urls[0])} />
      {nobg ? (
        <BgRemoverDialog open={nobg} onOpenChange={setNobg} src={value} code={code} onDone={onChange} />
      ) : null}
    </div>
  );
}

/* ------------------------------ Font select ------------------------------ */

export function FontSelect({
  label,
  value,
  onChange,
  allowInherit = false,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  allowInherit?: boolean;
}) {
  const current = fontNameFromCss(value);
  const known = FONT_GROUPS.some((g) => g.fonts.includes(current));
  const [manual, setManual] = useState(!!current && !known);

  useEffect(() => {
    ensureFontLoaded(current);
  }, [current]);

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <select
        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
        value={manual ? "__manual" : current}
        style={{ fontFamily: value || undefined }}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__manual") {
            setManual(true);
            return;
          }
          setManual(false);
          onChange(v);
        }}
      >
        {allowInherit ? <option value="">Ikuti tema</option> : null}
        {FONT_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.fonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="__manual">Tulis manual...</option>
      </select>
      {manual ? (
        <Input
          className="h-8 text-xs"
          placeholder="Nama font Google, mis. Tangerine"
          defaultValue={current}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (!name) return;
            ensureFontLoaded(name);
            onChange(name);
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ Bg controls ------------------------------ */

const POSITIONS = [
  "center",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
  "top-left",
];

export function BgControls({
  value,
  onChange,
  code,
  title = "Latar & Crop",
}: {
  value: BgConfig;
  onChange: (patch: BgConfig) => void;
  code: string;
  title?: string;
}) {
  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="text-[11px] font-semibold uppercase text-muted-foreground">{title}</div>
      <ImageInput label="Gambar Latar" value={value.bgImage ?? ""} onChange={(v) => onChange({ bgImage: v })} code={code} accept="image/*" />
      <div className="space-y-1">
        <Label className="text-xs">Gradient (CSS)</Label>
        <Input
          className="h-8 text-xs"
          placeholder="linear-gradient(...)"
          value={value.bgGradient ?? ""}
          onChange={(e) => onChange({ bgGradient: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={value.bgSize ?? "cover"}
            onChange={(e) => onChange({ bgSize: e.target.value as BgConfig["bgSize"] })}
          >
            <option value="cover">cover (crop)</option>
            <option value="contain">contain</option>
            <option value="fill">fill</option>
            <option value="repeat">repeat</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Posisi</Label>
          <select
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={value.bgPosition ?? "center"}
            onChange={(e) => onChange({ bgPosition: e.target.value as BgConfig["bgPosition"] })}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="block text-[11px]">
        Zoom ({(value.bgZoom ?? 1).toFixed(2)}x)
        <input
          className="w-full"
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={value.bgZoom ?? 1}
          onChange={(e) => onChange({ bgZoom: Number(e.target.value) })}
        />
      </label>
      <label className="block text-[11px]">
        Rotate ({value.bgRotate ?? 0}°)
        <input
          className="w-full"
          type="range"
          min={0}
          max={360}
          value={value.bgRotate ?? 0}
          onChange={(e) => onChange({ bgRotate: Number(e.target.value) })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px]">
          Offset X ({value.bgOffsetX ?? 0}%)
          <input
            className="w-full"
            type="range"
            min={-50}
            max={50}
            value={value.bgOffsetX ?? 0}
            onChange={(e) => onChange({ bgOffsetX: Number(e.target.value) })}
          />
        </label>
        <label className="text-[11px]">
          Offset Y ({value.bgOffsetY ?? 0}%)
          <input
            className="w-full"
            type="range"
            min={-50}
            max={50}
            value={value.bgOffsetY ?? 0}
            onChange={(e) => onChange({ bgOffsetY: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="block text-[11px]">
        Opacity latar ({Math.round((value.bgOpacity ?? 1) * 100)}%)
        <input
          className="w-full"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value.bgOpacity ?? 1}
          onChange={(e) => onChange({ bgOpacity: Number(e.target.value) })}
        />
      </label>
      <label className="block text-[11px]">
        Overlay gelap ({value.overlay ?? 0}%)
        <input
          className="w-full"
          type="range"
          min={0}
          max={90}
          value={value.overlay ?? 0}
          onChange={(e) => onChange({ overlay: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
