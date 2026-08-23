import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteGuest, importGuestsCsv, listGuests, listRsvps, saveGuest } from "@/lib/invitation.functions";

export interface GuestRow {
  id: string;
  name: string;
  token: string;
  category: string;
  greeting: string | null;
  phone: string | null;
  created_at?: string;
}

interface RsvpRow {
  id?: string;
  guest_name: string;
  attending: boolean;
  headcount: number;
  message: string | null;
}

type Draft = { id?: string; name: string; category: string; phone: string; greeting: string };

const TEMPLATE = "nama,kategori,telepon,sapaan\nBapak Andi,Keluarga,6281234567890,Bapak\nIbu Sari,Teman,,Ibu\n";

const WA_KEY = "wa_message_template";
const DEFAULT_WA = `Assalamu'alaikum / Salam sejahtera 🌿

Kepada {sapaan} {nama},
Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di acara pernikahan kami.

Detail acara & konfirmasi kehadiran dapat dilihat pada undangan digital berikut:
{link}

Merupakan suatu kehormatan bagi kami apabila {sapaan} {nama} berkenan hadir dan memberikan doa restu.

Terima kasih 🙏`;

const WA_TOKENS = ["{nama}", "{sapaan}", "{kategori}", "{link}", "{token}"];

const guestLink = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/?guest=${token}`;

const fillTemplate = (tpl: string, g: GuestRow) =>
  tpl
    .replace(/\{nama\}/g, g.name)
    .replace(/\{sapaan\}/g, g.greeting ?? "")
    .replace(/\{kategori\}/g, g.category)
    .replace(/\{token\}/g, g.token)
    .replace(/\{link\}/g, guestLink(g.token))
    .replace(/[ \t]{2,}/g, " ")
    .trim();


function download(name: string, text: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(csv: string) {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let skipped = 0;
  if (lines.length && /nama|name/i.test(lines[0] ?? "")) {
    lines.shift();
    skipped += 1;
  }
  const rows = lines.map((line) => {
    const [name, category, phone, greeting] = line.split(/[,;]/).map((v) => v?.trim() ?? "");
    return { name: name || "Tamu", category: category || "Umum", phone: phone || "", greeting: greeting || "" };
  });
  return { rows, skipped };
}

export function GuestsManager({ code, onBack }: { code: string; onBack?: () => void }) {
  const load = useServerFn(listGuests);
  const save = useServerFn(saveGuest);
  const del = useServerFn(deleteGuest);
  const imp = useServerFn(importGuestsCsv);
  const rsvpFn = useServerFn(listRsvps);

  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "yes" | "no">("all");
  const [busy, setBusy] = useState(false);
  const [waTpl, setWaTpl] = useState(DEFAULT_WA);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplDraft, setTplDraft] = useState(DEFAULT_WA);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(WA_KEY) : null;
    if (saved) {
      setWaTpl(saved);
      setTplDraft(saved);
    }
  }, []);

  const openWa = useCallback(
    (g: GuestRow) => {
      const text = encodeURIComponent(fillTemplate(waTpl, g));
      const phone = (g.phone ?? "").replace(/\D/g, "");
      window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
    },
    [waTpl],
  );


  const refresh = useCallback(() => {
    load({ data: { code } }).then((d) => setGuests(d as GuestRow[])).catch(() => toast.error("Gagal memuat tamu"));
    rsvpFn({ data: { code } }).then((d) => setRsvps(d as RsvpRow[])).catch(() => undefined);
  }, [code, load, rsvpFn]);

  useEffect(refresh, [refresh]);

  const categories = useMemo(() => Array.from(new Set(guests.map((g) => g.category))).sort(), [guests]);
  const rsvpByName = useMemo(() => {
    const m = new Map<string, RsvpRow>();
    rsvps.forEach((r) => m.set(r.guest_name.trim().toLowerCase(), r));
    return m;
  }, [rsvps]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = guests.filter((g) => {
      const okQ =
        !needle ||
        g.name.toLowerCase().includes(needle) ||
        g.category.toLowerCase().includes(needle) ||
        (g.phone ?? "").includes(needle);
      return okQ && (cat === "all" || g.category === cat);
    });
    return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [guests, q, cat, sort]);

  const stats = useMemo(() => {
    const yes = rsvps.filter((r) => r.attending);
    return {
      total: guests.length,
      replied: rsvps.length,
      yes: yes.length,
      no: rsvps.length - yes.length,
      head: yes.reduce((s, r) => s + (r.headcount || 1), 0),
    };
  }, [guests, rsvps]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const exportRows = (rows: GuestRow[]) => {
    if (!rows.length) {
      toast.error("Tidak ada tamu untuk diekspor");
      return;
    }
    const csv = [
      "nama,kategori,telepon,sapaan,token,link",
      ...rows.map((g) =>
        [g.name, g.category, g.phone ?? "", g.greeting ?? "", g.token, guestLink(g.token)]
          .map((v) => (String(v).includes(",") ? `"${v}"` : v))
          .join(","),
      ),
    ].join("\n");
    download("tamu.csv", csv);
    toast.success(`${rows.length} tamu diekspor`);
  };

  const doImport = () => {
    const { rows } = parseCsv(importText);
    if (!rows.length) {
      toast.error("Tidak ada baris valid");
      return;
    }
    setBusy(true);
    imp({ data: { code, csv: importText } })
      .then((r) => {
        toast.success(`${r.inserted} tamu diimpor`);
        setImportOpen(false);
        setImportText("");
        refresh();
      })
      .catch(() => toast.error("Import gagal"))
      .finally(() => setBusy(false));
  };

  const preview = useMemo(() => parseCsv(importText), [importText]);

  const saveDraft = () => {
    if (!draft) return;
    setBusy(true);
    save({
      data: {
        code,
        guest: {
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name,
          category: draft.category || "Umum",
          greeting: draft.greeting,
          phone: draft.phone,
        },
      },
    })
      .then(() => {
        toast.success(draft.id ? "Tamu diperbarui" : "Tamu ditambahkan");
        setDraft(null);
        refresh();
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setBusy(false));
  };

  const removeMany = async (ids: string[]) => {
    setBusy(true);
    try {
      for (const id of ids) await del({ data: { code, id } });
      toast.success(`${ids.length} tamu dihapus`);
      setPicked([]);
      refresh();
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setBusy(false);
    }
  };

  const shownRsvps = rsvps.filter((r) => (rsvpFilter === "all" ? true : rsvpFilter === "yes" ? r.attending : !r.attending));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-3 pb-28 sm:p-6 lg:pb-6">
      <div className="flex flex-wrap items-center gap-2">
        {onBack ? (
          <Button size="sm" variant="ghost" onClick={onBack}>← Editor</Button>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Manajemen Tamu</h2>
          <p className="text-xs text-muted-foreground">Kelola daftar tamu, link personal, RSVP, import & export.</p>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 sm:ml-auto sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => {
              setTplDraft(waTpl);
              setTplOpen(true);
            }}
          >
            Pesan WA
          </Button>
          <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => setImportOpen(true)}>Import</Button>

          <Button size="sm" variant="outline" className="flex-1 sm:flex-none"
            onClick={() => exportRows(picked.length ? guests.filter((g) => picked.includes(g.id)) : filtered)}
          >
            Export
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setDraft({ name: "", category: "Umum", phone: "", greeting: "" })}>+ Tamu</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { l: "Total tamu", v: stats.total },
          { l: "Sudah RSVP", v: stats.replied },
          { l: "Hadir", v: stats.yes },
          { l: "Tidak hadir", v: stats.no },
          { l: "Total orang", v: stats.head },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border bg-card p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.l}</div>
            <div className="text-xl font-semibold">{s.v}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="guests">
        <TabsList>
          <TabsTrigger value="guests">Tamu ({guests.length})</TabsTrigger>
          <TabsTrigger value="rsvp">RSVP & Ucapan ({rsvps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-9 w-full sm:w-56" placeholder="Cari nama / kategori / telepon" value={q} onChange={(e) => setQ(e.target.value)} />
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="all">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "name")}
            >
              <option value="recent">Terbaru</option>
              <option value="name">Nama A-Z</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => {
                const links = filtered.map((g) => `${g.name}: ${guestLink(g.token)}`).join("\n");
                void navigator.clipboard?.writeText(links);
                toast.success("Semua link disalin");
              }}
            >
              Salin semua link
            </Button>
            {picked.length ? (
              <>
                <span className="text-xs text-muted-foreground">{picked.length} dipilih</span>
                <Button size="sm" variant="destructive" className="h-9" disabled={busy} onClick={() => removeMany(picked)}>
                  Hapus terpilih
                </Button>
              </>
            ) : null}
          </div>

          <div className="space-y-2">
            {filtered.length ? (
              <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={picked.length === filtered.length && filtered.length > 0}
                  onChange={(e) => setPicked(e.target.checked ? filtered.map((g) => g.id) : [])}
                />
                Pilih semua hasil
              </label>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Belum ada tamu. Tambah manual atau import CSV.
              </div>
            )}

            {filtered.map((g) => {
              const rsvp = rsvpByName.get(g.name.trim().toLowerCase());
              const link = guestLink(g.token);
              return (
                <div key={g.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" checked={picked.includes(g.id)} onChange={() => toggle(g.id)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{g.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{g.category}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            !rsvp ? "bg-muted text-muted-foreground" : rsvp.attending ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {!rsvp ? "Belum RSVP" : rsvp.attending ? `Hadir · ${rsvp.headcount}` : "Tidak hadir"}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {g.phone ? `${g.phone} · ` : ""}/?guest={g.token}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        void navigator.clipboard?.writeText(link);
                        toast.success("Link tamu disalin");
                      }}
                    >
                      Salin link
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.open(link, "_blank")}>
                      Pratinjau
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openWa(g)}>
                      WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() =>
                        setDraft({ id: g.id, name: g.name, category: g.category, phone: g.phone ?? "", greeting: g.greeting ?? "" })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" disabled={busy} onClick={() => removeMany([g.id])}>
                      Hapus
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-3">
          <div className="flex gap-1.5">
            {(["all", "yes", "no"] as const).map((f) => (
              <Button key={f} size="sm" variant={rsvpFilter === f ? "default" : "outline"} className="h-8 text-xs" onClick={() => setRsvpFilter(f)}>
                {f === "all" ? "Semua" : f === "yes" ? "Hadir" : "Tidak hadir"}
              </Button>
            ))}
          </div>
          {shownRsvps.length ? (
            shownRsvps.map((r, i) => (
              <div key={r.id ?? i} className="rounded-xl border bg-card p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.guest_name}</span>
                  <span className={`text-xs ${r.attending ? "text-emerald-600" : "text-destructive"}`}>
                    {r.attending ? `Hadir · ${r.headcount} orang` : "Tidak hadir"}
                  </span>
                </div>
                {r.message ? <p className="mt-1 text-xs text-muted-foreground">{r.message}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada RSVP.</div>
          )}
        </TabsContent>
      </Tabs>

      {/* EDIT / TAMBAH — tampilan sendiri */}
      <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <SheetContent side="bottom" className="h-[80dvh] overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{draft?.id ? "Edit Tamu" : "Tamu Baru"}</SheetTitle>
          </SheetHeader>
          {draft ? (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Nama tamu</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Kategori</Label>
                  <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Keluarga / Teman" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nomor WhatsApp</Label>
                  <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="6281..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sapaan khusus</Label>
                <Input value={draft.greeting} onChange={(e) => setDraft({ ...draft, greeting: e.target.value })} placeholder="Bapak / Ibu / Sdr." />
              </div>
              {draft.id ? (
                <div className="rounded-lg bg-muted/60 p-3 text-xs">
                  <div className="text-muted-foreground">Link undangan personal</div>
                  <div className="mt-1 break-all">{guestLink(guests.find((g) => g.id === draft.id)?.token ?? "")}</div>
                </div>
              ) : null}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" disabled={busy} onClick={saveDraft}>Simpan</Button>
                <Button variant="outline" onClick={() => setDraft(null)}>Batal</Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* IMPORT */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Tamu (CSV)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) setImportText(await file.text());
              }}
              className={`block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm ${dragging ? "border-primary bg-primary/5" : "text-muted-foreground"}`}
            >
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImportText(await file.text());
                }}
              />
              Klik untuk pilih file, atau tarik & lepas CSV di sini
            </label>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Format: nama, kategori, telepon, sapaan</span>
              <button type="button" className="underline" onClick={() => download("template-tamu.csv", TEMPLATE)}>
                Unduh template
              </button>
            </div>
            <Textarea
              rows={5}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Atau tempel data CSV di sini..."
              className="text-xs"
            />
            {importText.trim() ? (
              <div className="rounded-lg border">
                <div className="border-b px-3 py-2 text-xs">
                  {preview.rows.length} baris valid · {preview.skipped} baris header dilewati
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {preview.rows.slice(0, 40).map((r, i) => (
                    <div key={i} className="flex gap-2 border-b px-3 py-1.5 text-[11px] last:border-0">
                      <span className="w-6 text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate font-medium">{r.name}</span>
                      <span className="text-muted-foreground">{r.category}</span>
                      <span className="text-muted-foreground">{r.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy || !preview.rows.length} onClick={doImport}>
                Import {preview.rows.length ? `${preview.rows.length} tamu` : ""}
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(false)}>Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WA TEMPLATE */}
      <Sheet open={tplOpen} onOpenChange={(v) => setTplOpen(v)}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Template Pesan WhatsApp</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pt-3">
            <div className="flex flex-wrap gap-1.5">
              {WA_TOKENS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-md border px-2 py-1 text-[11px] hover:bg-accent"
                  onClick={() => setTplDraft((s) => `${s}${s.endsWith(" ") || !s ? "" : " "}${t}`)}
                >
                  {t}
                </button>
              ))}
            </div>
            <Textarea rows={12} className="text-xs" value={tplDraft} onChange={(e) => setTplDraft(e.target.value)} />
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Pratinjau</div>
              <div className="whitespace-pre-wrap break-words text-xs">
                {fillTemplate(
                  tplDraft,
                  guests[0] ?? {
                    id: "-",
                    name: "Bapak Andi",
                    token: "contoh123",
                    category: "Keluarga",
                    greeting: "Bapak",
                    phone: "6281234567890",
                  },
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={() => {
                  setWaTpl(tplDraft);
                  window.localStorage.setItem(WA_KEY, tplDraft);
                  setTplOpen(false);
                  toast.success("Template pesan disimpan");
                }}
              >
                Simpan template
              </Button>
              <Button variant="outline" onClick={() => setTplDraft(DEFAULT_WA)}>Kembalikan default</Button>
              <Button variant="ghost" onClick={() => setTplOpen(false)}>Tutup</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>

  );
}
