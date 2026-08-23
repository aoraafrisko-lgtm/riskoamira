import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FIELD_CATEGORIES,
  FIELD_REGISTRY,
  ANIMATION_EFFECTS,
  behaviorControls,
  createField,
  getDefinition,
  type ControlDef,
} from "@/lib/builder/registry";
import { SECTION_PRESETS, SUBSECTION_PRESETS, createSection, createSubsection } from "@/lib/builder/presets";
import { CanvasStage } from "@/components/invitation/CanvasStage";
import { GuestsManager } from "@/components/admin/GuestsManager";
import * as T from "@/lib/builder/tree";
import { emptyConfig, uid } from "@/lib/builder/types";
import type { Breakpoint, FreePos, InvitationConfig, Photo, Selection, StyleConfig } from "@/lib/builder/types";
import {
  getDraftConfig,
  publishInvitation,
  saveDraftConfig,
  verifyAdminCode,
  uploadMedia,
} from "@/lib/invitation.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Wedding Invitation Builder" },
      { name: "description", content: "Login admin dan visual editor untuk membangun undangan pernikahan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Wedding Invitation Builder" },
      { property: "og:description", content: "Visual editor undangan pernikahan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [code, setCode] = useState("");
  const verify = useServerFn(verifyAdminCode);
  const [authed, setAuthed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("wib_code");
    if (saved) setAuthed(saved);
  }, []);

  if (authed) return <Editor code={authed} onLogout={() => { sessionStorage.removeItem("wib_code"); setAuthed(null); }} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          verify({ data: { code } })
            .then(() => {
              sessionStorage.setItem("wib_code", code);
              setAuthed(code);
            })
            .catch(() => toast.error("Kode admin salah"))
            .finally(() => setBusy(false));
        }}
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Wedding Builder</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk membuka visual editor</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Kode Admin</Label>
          <Input id="code" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Memeriksa..." : "Masuk"}
        </Button>
      </form>
    </main>
  );
}

/* ----------------------------- EDITOR ----------------------------- */

type SaveState = "saved" | "saving" | "dirty";

function Editor({ code, onLogout }: { code: string; onLogout: () => void }) {
  const [config, setConfig] = useState<InvitationConfig>(emptyConfig());
  const [past, setPast] = useState<InvitationConfig[]>([]);
  const [future, setFuture] = useState<InvitationConfig[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const breakpoint: Breakpoint = "mobile";
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sectionPicker, setSectionPicker] = useState(false);
  const [subPicker, setSubPicker] = useState<string | null>(null);
  const [fieldPicker, setFieldPicker] = useState<{ sectionId: string; subId: string } | null>(null);
  const [panel, setPanel] = useState<"editor" | "guests">("editor");
  const [sheet, setSheet] = useState<"structure" | "settings" | "guests" | null>(null);
  const [animPreview, setAnimPreview] = useState<{ nonce: number; fieldIds: string[] }>({ nonce: 0, fieldIds: [] });

  /** Putar ulang animasi pada kanvas editor untuk item yang sedang dipilih. */
  const playAnim = (scope: "selection" | "section" = "selection") => {
    if (!selection) return;
    const section = T.findSection(config, selection.sectionId);
    if (!section) return;
    let ids: string[] = [];
    if (scope === "section" || selection.kind === "section") {
      ids = (section.subsections ?? []).flatMap((s) => (s.fields ?? []).map((f) => f.id));
    } else if (selection.kind === "subsection") {
      const sub = T.findSubsection(config, selection.sectionId, selection.subsectionId);
      ids = (sub?.fields ?? []).map((f) => f.id);
    } else if (selection.fieldId) {
      ids = [selection.fieldId];
    }
    if (!ids.length) return;
    setAnimPreview((p) => ({ nonce: p.nonce + 1, fieldIds: ids }));
  };



  const load = useServerFn(getDraftConfig);
  const save = useServerFn(saveDraftConfig);
  const publish = useServerFn(publishInvitation);
  const dirtyRef = useRef(false);

  useEffect(() => {
    load({ data: { code } })
      .then((res) => {
        const cfg = (res.draft as InvitationConfig | null) ?? emptyConfig();
        setConfig({ ...emptyConfig(), ...cfg, sections: cfg.sections ?? [] });
      })
      .catch(() => toast.error("Gagal memuat konfigurasi"))
      .finally(() => setLoaded(true));
  }, [code, load]);

  const commit = useCallback((updater: (c: InvitationConfig) => InvitationConfig) => {
    setConfig((prev) => {
      setPast((p) => [...p.slice(-49), prev]);
      setFuture([]);
      dirtyRef.current = true;
      setSaveState("dirty");
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setConfig((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      dirtyRef.current = true;
      setSaveState("dirty");
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setConfig((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      dirtyRef.current = true;
      setSaveState("dirty");
      return f.slice(1);
    });
  }, []);

  const doSave = useCallback(
    (cfg: InvitationConfig) => {
      setSaveState("saving");
      save({ data: { code, config: cfg } })
        .then(() => {
          dirtyRef.current = false;
          setSaveState("saved");
        })
        .catch(() => setSaveState("dirty"));
    },
    [code, save],
  );

  // autosave
  useEffect(() => {
    if (!loaded || !dirtyRef.current) return;
    const t = setTimeout(() => doSave(config), 1200);
    return () => clearTimeout(t);
  }, [config, loaded, doSave]);

  // shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave(config);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo, doSave, config]);


  const hooks = {
    selection,
    onSelect: setSelection,
    onAddSection: () => setSectionPicker(true),
    onAddSubsection: (sectionId: string) => setSubPicker(sectionId),
    onAddField: (sectionId: string, subId: string) => setFieldPicker({ sectionId, subId }),
    onInlineEdit: (sel: Selection, key: string, value: string) => {
      if (!sel.fieldId || !sel.subsectionId) return;
      const f = T.findField(config, sel.sectionId, sel.subsectionId, sel.fieldId);
      if (!f) return;
      commit((c) =>
        T.updateField(c, sel.sectionId, sel.subsectionId!, sel.fieldId!, {
          content: { ...f.content, [key]: value },
        }),
      );
    },
    onMovePos: (sel: Selection, pos: FreePos) => {
      if (!sel.fieldId || !sel.subsectionId) return;
      const f = T.findField(config, sel.sectionId, sel.subsectionId, sel.fieldId);
      if (!f) return;
      // kanvas tunggal 1080×1920 → posisi disimpan di satu tempat
      const patch = { pos: { ...(f.pos ?? {}), ...pos } };
      commit((c) => T.updateField(c, sel.sectionId, sel.subsectionId!, sel.fieldId!, patch));
    },
    toolbar: (sel: Selection) => <Toolbar sel={sel} config={config} commit={commit} setSelection={setSelection} />,
  };

  const structureTree = (
    <StructurePanel
      config={config}
      selection={selection}
      setSelection={setSelection}
      commit={commit}
      onAddSection={() => setSectionPicker(true)}
      onAddSubsection={(id) => setSubPicker(id)}
      onAddField={(s, sub) => setFieldPicker({ sectionId: s, subId: sub })}
    />
  );
  const settingsPanel = (
    <SettingsPanel
      config={config}
      selection={selection}
      commit={commit}
      breakpoint={breakpoint}
      code={code}
      onPlayAnim={playAnim}
    />
  );


  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "#141210" }}>
        <Button className="fixed right-3 top-3 z-50" size="sm" onClick={() => setFullscreen(false)}>
          Tutup
        </Button>
        <CanvasStage fit="viewport">
          <InvitationRenderer config={config} ctx={{ editor: false, breakpoint }} />
        </CanvasStage>
      </div>
    );
  }

  if (panel === "guests") {
    return (
      <div className="min-h-[100dvh] bg-muted/30">
        <GuestsManager code={code} onBack={() => setPanel("editor")} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/30">

      <header className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden truncate text-sm font-semibold sm:inline">Wedding Builder</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {saveState === "saved" ? "✓ Tersimpan" : saveState === "saving" ? "Menyimpan..." : "Belum tersimpan"}
          </span>
          <span className="text-xs text-muted-foreground sm:hidden">
            {saveState === "saved" ? "✓" : saveState === "saving" ? "…" : "•"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden rounded-md border px-2 py-1 text-[11px] text-muted-foreground sm:inline">
            Mobile 1080×1920
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={undo} disabled={!past.length} aria-label="Undo">↶</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={redo} disabled={!future.length} aria-label="Redo">↷</Button>
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFullscreen(true)}>Preview</Button>
          <Button
            size="sm"
            className="h-8 px-2"
            onClick={() =>
              publish({ data: { code, config } })
                .then(() => toast.success("Undangan dipublikasikan"))
                .catch(() => toast.error("Gagal publish"))
            }
          >
            Publish
          </Button>
          <Button size="sm" variant="ghost" className="hidden h-8 px-2 sm:inline-flex" onClick={() => doSave(config)}>Save</Button>
          <Button size="sm" variant="ghost" className="hidden h-8 px-2 sm:inline-flex" onClick={onLogout}>Keluar</Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 lg:flex-row">
        {/* STRUCTURE — desktop only */}
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Struktur</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPanel("guests")}>
              Tamu →
            </Button>
          </div>
          <ScrollArea className="h-[calc(100dvh-6.2rem)]">{structureTree}</ScrollArea>
        </aside>


        {/* PREVIEW */}
        <main className="min-h-0 flex-1 overflow-auto bg-muted/50 p-2 pb-20 sm:p-4 lg:pb-4">
          <div className="mx-auto overflow-hidden rounded-[26px] border bg-background shadow-sm" style={{ maxWidth: 460 }}>
            <CanvasStage fit="container">
              <InvitationRenderer
                config={config}
                ctx={{ editor: true, breakpoint, guestName: "Bapak Andi", animPreview }}
                editorHooks={hooks}
              />
            </CanvasStage>
          </div>
        </main>

        {/* SETTINGS — desktop only */}
        <aside className="hidden w-80 shrink-0 border-l bg-card lg:block">
          <ScrollArea className="h-[calc(100dvh-3.5rem)]">{settingsPanel}</ScrollArea>
        </aside>
      </div>

      {/* MOBILE BOTTOM BAR + SHEETS */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t bg-card/95 p-1.5 backdrop-blur lg:hidden">
        <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => setSheet("structure")}>Struktur</Button>
        <Button size="sm" variant={selection ? "default" : "outline"} className="h-10 text-xs" onClick={() => setSheet("settings")}>Setting</Button>
        <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => setPanel("guests")}>Tamu</Button>
        <Button size="sm" variant="outline" className="h-10 text-xs" onClick={() => doSave(config)}>Save</Button>
      </div>

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent side="bottom" className="h-[78dvh] p-0 lg:hidden">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-base">{sheet === "structure" ? "Struktur" : "Pengaturan"}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(78dvh-3.5rem)]">
            {sheet === "structure" ? structureTree : sheet === "settings" ? settingsPanel : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>


      {/* PICKERS */}
      <PresetDialog
        open={sectionPicker}
        title="Tambah Section"
        options={SECTION_PRESETS}
        onClose={() => setSectionPicker(false)}
        onPick={(preset) => {
          const sec = createSection(preset, config.sections.length + 1);
          commit((c) => T.insertSection(c, sec));
          setSelection({ kind: "section", sectionId: sec.id });
          setSectionPicker(false);
        }}
      />
      <PresetDialog
        open={!!subPicker}
        title="Tambah Subsection"
        options={SUBSECTION_PRESETS}
        onClose={() => setSubPicker(null)}
        onPick={(preset) => {
          const sectionId = subPicker!;
          const count = (T.findSection(config, sectionId)?.subsections.length ?? 0) + 1;
          const sub = createSubsection(preset, count);
          commit((c) => T.insertSubsection(c, sectionId, sub));
          setSelection({ kind: "subsection", sectionId, subsectionId: sub.id });
          setSubPicker(null);
        }}
      />
      <FieldLibrary
        open={!!fieldPicker}
        onClose={() => setFieldPicker(null)}
        onPick={(type) => {
          const target = fieldPicker!;
          const field = createField(type);
          const targetSub = T.findSubsection(config, target.sectionId, target.subId);
          if (targetSub?.layout === "free") {
            const n = targetSub.fields.length;
            field.pos = { x: 8 + (n % 3) * 6, y: 24 + n * 28, w: 50 };
          }
          commit((c) => T.insertField(c, target.sectionId, target.subId, field));
          setSelection({ kind: "field", sectionId: target.sectionId, subsectionId: target.subId, fieldId: field.id });
          setFieldPicker(null);
        }}
      />
    </div>
  );
}

/* ---------------------- Toolbar (in preview) ---------------------- */

function Toolbar({
  sel,
  config,
  commit,
  setSelection,
}: {
  sel: Selection;
  config: InvitationConfig;
  commit: (fn: (c: InvitationConfig) => InvitationConfig) => void;
  setSelection: (s: Selection | null) => void;
}) {
  const node =
    sel.kind === "section"
      ? T.findSection(config, sel.sectionId)
      : sel.kind === "subsection"
        ? T.findSubsection(config, sel.sectionId, sel.subsectionId)
        : T.findField(config, sel.sectionId, sel.subsectionId, sel.fieldId);
  if (!node) return null;

  const btn = (label: string, fn: () => void) => (
    <button
      key={label}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        fn();
      }}
      className="px-2 py-0.5 text-[10px] text-primary-foreground hover:bg-primary/80"
    >
      {label}
    </button>
  );

  const duplicate = () => {
    if (sel.kind === "section") {
      const copy = T.duplicateNode(T.findSection(config, sel.sectionId)!);
      commit((c) => T.insertSection(c, copy, c.sections.findIndex((s) => s.id === sel.sectionId) + 1));
    } else if (sel.kind === "subsection") {
      const copy = T.duplicateNode(T.findSubsection(config, sel.sectionId, sel.subsectionId)!);
      commit((c) => T.insertSubsection(c, sel.sectionId, copy));
    } else {
      const copy = T.duplicateNode(T.findField(config, sel.sectionId, sel.subsectionId, sel.fieldId)!);
      commit((c) => T.insertField(c, sel.sectionId, sel.subsectionId!, copy));
    }
  };

  const remove = () => {
    if (!confirm("Hapus item ini?")) return;
    if (sel.kind === "section") commit((c) => T.removeSection(c, sel.sectionId));
    else if (sel.kind === "subsection") commit((c) => T.removeSubsection(c, sel.sectionId, sel.subsectionId!));
    else commit((c) => T.removeField(c, sel.sectionId, sel.subsectionId!, sel.fieldId!));
    setSelection(null);
  };

  const toggleHide = () => {
    const patch = { hidden: !node.hidden };
    if (sel.kind === "section") commit((c) => T.updateSection(c, sel.sectionId, patch));
    else if (sel.kind === "subsection") commit((c) => T.updateSubsection(c, sel.sectionId, sel.subsectionId!, patch));
    else commit((c) => T.updateField(c, sel.sectionId, sel.subsectionId!, sel.fieldId!, patch));
  };

  const move = (dir: -1 | 1) => {
    if (sel.kind === "section") {
      const i = config.sections.findIndex((s) => s.id === sel.sectionId);
      commit((c) => T.reorderSections(c, i, i + dir));
    } else if (sel.kind === "subsection") {
      const subs = T.findSection(config, sel.sectionId)?.subsections ?? [];
      const i = subs.findIndex((s) => s.id === sel.subsectionId);
      commit((c) => T.reorderSubsections(c, sel.sectionId, i, i + dir));
    } else {
      const fields = T.findSubsection(config, sel.sectionId, sel.subsectionId)?.fields ?? [];
      const i = fields.findIndex((f) => f.id === sel.fieldId);
      commit((c) => T.reorderFields(c, sel.sectionId, sel.subsectionId!, i, i + dir));
    }
  };

  const fieldNode = sel.kind === "field" ? T.findField(config, sel.sectionId, sel.subsectionId, sel.fieldId) : null;

  const patchField = (patch: Record<string, unknown>) =>
    commit((c) => T.updateField(c, sel.sectionId, sel.subsectionId!, sel.fieldId!, patch as never));

  const subNode = sel.kind === "field" ? T.findSubsection(config, sel.sectionId, sel.subsectionId) : null;
  // di layout "free" field bebas secara default, kecuali ditandai free: false (Rapikan)
  const isFree = fieldNode ? (subNode?.layout === "free" ? fieldNode.free !== false : !!fieldNode.free) : false;

  const toggleFree = () => {
    if (!fieldNode) return;
    patchField(
      isFree
        ? { free: false, pos: undefined }
        : { free: true, pos: { x: 10, y: 20, w: 60, ...(fieldNode.pos ?? {}) } },
    );
  };

  const layer = (dir: -1 | 1) => {
    if (!fieldNode) return;
    const z = (fieldNode.pos?.z ?? fieldNode.style?.zIndex ?? 1) + dir;
    patchField({ pos: { ...(fieldNode.pos ?? {}), z } });
  };

  const nudge = (dx: number, dy: number) => {
    if (!fieldNode) return;
    const p = { x: 0, y: 0, w: 40, ...(fieldNode.pos ?? {}) };
    patchField({ pos: { ...p, x: Math.round((p.x + dx) * 10) / 10, y: p.y + dy } });
  };

  return (
    <div className="flex overflow-hidden rounded-md bg-primary shadow">
      {isFree ? (
        <>
          {btn("◀", () => nudge(-1, 0))}
          {btn("▶", () => nudge(1, 0))}
          {btn("▲", () => nudge(0, -6))}
          {btn("▼", () => nudge(0, 6))}
          {btn("z+", () => layer(1))}
          {btn("z-", () => layer(-1))}
        </>
      ) : (
        <>
          {btn("↑", () => move(-1))}
          {btn("↓", () => move(1))}
        </>
      )}
      {fieldNode ? btn(isFree ? "🔒 Rapikan" : "✥ Bebas", toggleFree) : null}
      {btn("Duplicate", duplicate)}
      {btn(node.hidden ? "Show" : "Hide", toggleHide)}
      {btn("Delete", remove)}
    </div>
  );
}

/* ---------------------- Structure panel ---------------------- */

function StructurePanel({
  config,
  selection,
  setSelection,
  commit,
  onAddSection,
  onAddSubsection,
  onAddField,
}: {
  config: InvitationConfig;
  selection: Selection | null;
  setSelection: (s: Selection) => void;
  commit: (fn: (c: InvitationConfig) => InvitationConfig) => void;
  onAddSection: () => void;
  onAddSubsection: (sectionId: string) => void;
  onAddField: (sectionId: string, subId: string) => void;
}) {
  const [drag, setDrag] = useState<{ kind: string; sectionId: string; subId?: string; index: number } | null>(null);

  const rowCls = (active: boolean) =>
    `flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs ${active ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`;

  return (
    <div className="space-y-2 p-2">
      <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Undangan</div>
      <Button size="sm" variant="outline" className="w-full" onClick={onAddSection}>
        ＋ Tambah Section
      </Button>
      {config.sections.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-muted-foreground">Belum ada Section. Mulai buat undangan Anda.</p>
      )}
      {config.sections.map((section, si) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => setDrag({ kind: "section", sectionId: section.id, index: si })}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag?.kind === "section") commit((c) => T.reorderSections(c, drag.index, si));
            setDrag(null);
          }}
          className="rounded border bg-background p-1"
        >
          <button
            type="button"
            className={rowCls(selection?.kind === "section" && selection.sectionId === section.id)}
            onClick={() => setSelection({ kind: "section", sectionId: section.id })}
          >
            <span className="text-muted-foreground">⋮⋮</span>
            <span className="truncate">{section.name}</span>
            {section.hidden ? <span className="ml-auto text-[10px] text-muted-foreground">hidden</span> : null}
          </button>
          <div className="space-y-1 pl-3">
            {section.subsections.map((sub, ui) => (
              <div
                key={sub.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDrag({ kind: "sub", sectionId: section.id, index: ui });
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation();
                  if (drag?.kind === "sub" && drag.sectionId === section.id)
                    commit((c) => T.reorderSubsections(c, section.id, drag.index, ui));
                  setDrag(null);
                }}
              >
                <button
                  type="button"
                  className={rowCls(selection?.kind === "subsection" && selection.subsectionId === sub.id)}
                  onClick={() => setSelection({ kind: "subsection", sectionId: section.id, subsectionId: sub.id })}
                >
                  <span className="text-muted-foreground">⋮⋮</span>
                  <span className="truncate">{sub.name}</span>
                </button>
                <div className="space-y-0.5 pl-3">
                  {sub.fields.map((f, fi) => (
                    <button
                      key={f.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDrag({ kind: "field", sectionId: section.id, subId: sub.id, index: fi });
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        if (drag?.kind === "field" && drag.subId === sub.id)
                          commit((c) => T.reorderFields(c, section.id, sub.id, drag.index, fi));
                        setDrag(null);
                      }}
                      className={rowCls(selection?.kind === "field" && selection.fieldId === f.id)}
                      onClick={() =>
                        setSelection({ kind: "field", sectionId: section.id, subsectionId: sub.id, fieldId: f.id })
                      }
                    >
                      <span className="text-muted-foreground">⋮⋮</span>
                      <span className="truncate">{getDefinition(f.type)?.name ?? f.type}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => onAddField(section.id, sub.id)}
                  >
                    ＋ Tambah Field
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => onAddSubsection(section.id)}
            >
              ＋ Tambah Subsection
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------- Preset dialog ---------------------- */

function PresetDialog({
  open,
  title,
  options,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  options: { id: string; name: string; description: string }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              className={`rounded-lg border p-3 text-left transition hover:border-primary hover:bg-accent ${i === 0 ? "border-primary" : ""}`}
            >
              <div className="text-sm font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">{o.description}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Field library ---------------------- */

function FieldLibrary({ open, onPick, onClose }: { open: boolean; onPick: (type: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => Object.values(FIELD_REGISTRY), []);
  const filtered = useMemo(
    () =>
      all.filter(
        (f) =>
          !q.trim() ||
          f.name.toLowerCase().includes(q.toLowerCase()) ||
          f.description.toLowerCase().includes(q.toLowerCase()) ||
          f.category.toLowerCase().includes(q.toLowerCase()),
      ),
    [all, q],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tambah Field</DialogTitle>
        </DialogHeader>
        <Input placeholder="🔍 Cari field..." value={q} onChange={(e) => setQ(e.target.value)} />
        <ScrollArea className="h-[60vh] pr-2">
          <div className="space-y-5">
            {FIELD_CATEGORIES.map((cat) => {
              const items = filtered.filter((f) => f.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {items.map((f) => (
                      <button
                        key={f.type}
                        type="button"
                        onClick={() => onPick(f.type)}
                        className="rounded-lg border p-2.5 text-left transition hover:border-primary hover:bg-accent"
                      >
                        <div className="text-sm font-medium">{f.name}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">{f.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Settings panel ---------------------- */

function SettingsPanel({
  config,
  selection,
  commit,
  breakpoint,
  code,
  onPlayAnim,
}: {
  config: InvitationConfig;
  selection: Selection | null;
  commit: (fn: (c: InvitationConfig) => InvitationConfig) => void;
  breakpoint: Breakpoint;
  code: string;
  onPlayAnim: (scope?: "selection" | "section") => void;
}) {
  if (!selection) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tema Undangan</div>
        <ColorRow label="Background" value={config.theme.bgColor ?? "#fbf8f4"} onChange={(v) => commit((c) => ({ ...c, theme: { ...c.theme, bgColor: v } }))} />
        <ColorRow label="Warna Teks" value={config.theme.textColor ?? "#3b332c"} onChange={(v) => commit((c) => ({ ...c, theme: { ...c.theme, textColor: v } }))} />
        <ColorRow label="Aksen" value={config.theme.accentColor ?? "#b08d57"} onChange={(v) => commit((c) => ({ ...c, theme: { ...c.theme, accentColor: v } }))} />
        <p className="text-xs text-muted-foreground">Pilih Section, Subsection, atau Field untuk mengatur detailnya.</p>
      </div>
    );
  }

  const section = T.findSection(config, selection.sectionId);
  const sub = T.findSubsection(config, selection.sectionId, selection.subsectionId);
  const field = T.findField(config, selection.sectionId, selection.subsectionId, selection.fieldId);
  const node = selection.kind === "field" ? field : selection.kind === "subsection" ? sub : section;
  if (!node) return <div className="p-4 text-xs text-muted-foreground">Item tidak ditemukan.</div>;

  const def = field ? getDefinition(field.type) : undefined;

  const patchStyle = (patch: StyleConfig, responsive = false) => {
    const apply = (cur: typeof node) => {
      if (!responsive || selection.kind !== "field" || !field) return { style: { ...cur.style, ...patch } };
      const bpStyle = { ...(field.responsive[breakpoint] ?? {}), ...patch };
      return { responsive: { ...field.responsive, [breakpoint]: bpStyle } };
    };
    const p = apply(node);
    if (selection.kind === "section") commit((c) => T.updateSection(c, selection.sectionId, p));
    else if (selection.kind === "subsection") commit((c) => T.updateSubsection(c, selection.sectionId, selection.subsectionId!, p));
    else commit((c) => T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, p));
  };

  const patchContent = (key: string, value: unknown) => {
    if (!field) return;
    commit((c) =>
      T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, {
        content: { ...field.content, [key]: value as never },
      }),
    );
  };

  const patchBehavior = (key: string, value: unknown) => {
    if (!field) return;
    commit((c) =>
      T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, {
        behavior: { ...field.behavior, [key]: value as never },
      }),
    );
  };

  const patchAnimation = (key: string, value: unknown) => {
    const anim = { ...(node.animation ?? {}), [key]: value };
    if (selection.kind === "section") commit((c) => T.updateSection(c, selection.sectionId, { animation: anim }));
    else if (selection.kind === "subsection") commit((c) => T.updateSubsection(c, selection.sectionId, selection.subsectionId!, { animation: anim }));
    else commit((c) => T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, { animation: anim }));
    // langsung tampilkan pratinjau setelah diedit
    window.setTimeout(() => onPlayAnim(), 60);
  };


  const style = node.style ?? {};

  const posBase: FreePos = { x: 0, y: 0, w: 40, ...(field?.pos ?? {}) };
  const posEff: FreePos = { ...posBase, ...(field?.posResponsive?.[breakpoint] ?? {}) };
  const patchPos = (patch: FreePos) => {
    if (!field) return;
    const p = { pos: { ...posBase, ...patch } };
    commit((c) => T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, p));
  };

  return (
    <div className="p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {selection.kind === "field" ? `Field: ${def?.name ?? field?.type}` : selection.kind === "subsection" ? "Subsection" : "Section"}
      </div>
      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="text-[11px]">Content</TabsTrigger>
          <TabsTrigger value="design" className="text-[11px]">Design</TabsTrigger>
          <TabsTrigger value="behavior" className="text-[11px]">Behavior</TabsTrigger>
          <TabsTrigger value="anim" className="text-[11px]">Anim</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3 pt-3">
          {selection.kind !== "field" && (
            <FieldInput
              label="Nama"
              value={(node as { name?: string }).name ?? ""}
              onChange={(v) =>
                selection.kind === "section"
                  ? commit((c) => T.updateSection(c, selection.sectionId, { name: v }))
                  : commit((c) => T.updateSubsection(c, selection.sectionId, selection.subsectionId!, { name: v }))
              }
            />
          )}
          {selection.kind === "subsection" && (
            <>
              <SelectRow
                label="Layout"
                value={sub?.layout ?? "stack"}
                options={["stack", "row", "grid-2", "grid-3", "free"]}
                onChange={(v) => commit((c) => T.updateSubsection(c, selection.sectionId, selection.subsectionId!, { layout: v as never }))}
              />
              {sub?.layout === "free" && (
                <>
                  <NumRow
                    label="Tinggi Canvas (px)"
                    value={sub.canvasHeight ?? 420}
                    step={20}
                    onChange={(v) => commit((c) => T.updateSubsection(c, selection.sectionId, selection.subsectionId!, { canvasHeight: v }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mode bebas: drag field ke mana saja di canvas, tarik titik emas untuk mengubah lebar.
                  </p>
                </>
              )}
            </>
          )}
          {field &&
            (def?.controls ?? []).map((ctl) => (
              <ControlInput key={ctl.key} ctl={ctl} value={field.content[ctl.key]} onChange={(v) => patchContent(ctl.key, v)} code={code} />
            ))}
        </TabsContent>

        <TabsContent value="design" className="space-y-3 pt-3">
          {selection.kind === "field" && field && (
            <div className="rounded-md border p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Posisi bebas — {breakpoint}
                </span>
                <Switch
                  checked={sub?.layout === "free" ? field.free !== false : !!field.free}
                  onCheckedChange={(v) =>
                    commit((c) =>
                      T.updateField(c, selection.sectionId, selection.subsectionId!, selection.fieldId!, {
                        free: v,
                        ...(v ? { pos: { x: 10, y: 20, w: 60, ...(field.pos ?? {}) } } : { pos: undefined }),
                      } as never),
                    )
                  }
                />
              </div>
              {(sub?.layout === "free" ? field.free !== false : !!field.free) ? (
                <>
                  <NumRow label="X (%)" value={posEff.x} onChange={(v) => patchPos({ x: v })} />
                  <NumRow label="Y (px)" value={posEff.y} onChange={(v) => patchPos({ y: v })} />
                  <NumRow label="Lebar (%)" value={posEff.w} onChange={(v) => patchPos({ w: v })} />
                  <NumRow label="Layer (z)" value={posEff.z} onChange={(v) => patchPos({ z: v })} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Drag field di preview ke mana pun (boleh menimpa teks lain). Tombol panah = geser halus,
                    Shift+drag = snap, titik emas = ubah lebar.
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Aktifkan untuk melepas field dari alur, lalu drag bebas ke kanan/bawah/menimpa elemen lain.
                </p>
              )}
            </div>
          )}
          <ColorRow label="Background" value={style.bgColor ?? "#ffffff"} onChange={(v) => patchStyle({ bgColor: v })} />
          <ColorRow label="Warna Teks" value={style.textColor ?? "#000000"} onChange={(v) => patchStyle({ textColor: v })} />
          <FieldInput label="Background Image URL" value={style.bgImage ?? ""} onChange={(v) => patchStyle({ bgImage: v })} />
          <FieldInput label="Gradient (CSS)" value={style.bgGradient ?? ""} onChange={(v) => patchStyle({ bgGradient: v })} />
          <NumRow label="Font Size" value={style.fontSize} onChange={(v) => patchStyle({ fontSize: v })} />
          <NumRow label="Font Weight" value={style.fontWeight} step={100} onChange={(v) => patchStyle({ fontWeight: v })} />
          <NumRow label="Letter Spacing" value={style.letterSpacing} onChange={(v) => patchStyle({ letterSpacing: v })} />
          <SelectRow label="Alignment" value={style.align ?? "left"} options={["left", "center", "right"]} onChange={(v) => patchStyle({ align: v as never })} />
          <NumRow label="Padding Y" value={style.paddingY} onChange={(v) => patchStyle({ paddingY: v })} />
          <NumRow label="Padding X" value={style.paddingX} onChange={(v) => patchStyle({ paddingX: v })} />
          <NumRow label="Margin Top" value={style.marginTop} onChange={(v) => patchStyle({ marginTop: v })} />
          <NumRow label="Margin Bottom" value={style.marginBottom} onChange={(v) => patchStyle({ marginBottom: v })} />
          <NumRow label="Min Height" value={style.minHeight} onChange={(v) => patchStyle({ minHeight: v })} />
          <NumRow label="Radius" value={style.radius} onChange={(v) => patchStyle({ radius: v })} />
          <NumRow label="Border Width" value={style.borderWidth} onChange={(v) => patchStyle({ borderWidth: v })} />
          <ColorRow label="Border Color" value={style.borderColor ?? "#000000"} onChange={(v) => patchStyle({ borderColor: v })} />
          <SelectRow label="Shadow" value={style.shadow ?? "none"} options={["none", "sm", "md", "lg", "xl"]} onChange={(v) => patchStyle({ shadow: v as never })} />
          <NumRow label="Opacity (0-1)" value={style.opacity} step={0.1} onChange={(v) => patchStyle({ opacity: v })} />
          <NumRow label="Rotate (deg)" value={style.rotate} onChange={(v) => patchStyle({ rotate: v })} />
          <NumRow label="Overlay (%)" value={style.overlay} onChange={(v) => patchStyle({ overlay: v })} />
          <NumRow label="Z-Index" value={style.zIndex} onChange={(v) => patchStyle({ zIndex: v })} />
          {selection.kind === "field" && (
            <div className="rounded-md border p-2">
              <div className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
                Responsive override — {breakpoint}
              </div>
              <NumRow
                label="Font Size"
                value={field?.responsive[breakpoint]?.fontSize}
                onChange={(v) => patchStyle({ fontSize: v }, true)}
              />
              <NumRow
                label="Min Height"
                value={field?.responsive[breakpoint]?.minHeight}
                onChange={(v) => patchStyle({ minHeight: v }, true)}
              />
              <NumRow
                label="Padding Y"
                value={field?.responsive[breakpoint]?.paddingY}
                onChange={(v) => patchStyle({ paddingY: v }, true)}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-3 pt-3">
          {field && def ? (
            behaviorControls(def.render).length ? (
              behaviorControls(def.render).map((ctl) => (
                <ControlInput key={ctl.key} ctl={ctl} value={field.behavior[ctl.key]} onChange={(v) => patchBehavior(ctl.key, v)} code={code} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Field ini tidak memiliki pengaturan behavior.</p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Pilih sebuah Field untuk mengatur behavior.</p>
          )}
        </TabsContent>

        <TabsContent value="anim" className="space-y-3 pt-3">
          <SelectRow label="Effect" value={node.animation?.effect ?? "none"} options={ANIMATION_EFFECTS} onChange={(v) => patchAnimation("effect", v)} />
          <SelectRow label="Trigger" value={node.animation?.trigger ?? "scroll"} options={["scroll", "load"]} onChange={(v) => patchAnimation("trigger", v)} />
          <SelectRow label="Direction" value={node.animation?.direction ?? "up"} options={["up", "down", "left", "right"]} onChange={(v) => patchAnimation("direction", v)} />
          <NumRow label="Duration (ms)" value={node.animation?.duration} step={50} onChange={(v) => patchAnimation("duration", v)} />
          <NumRow label="Delay (ms)" value={node.animation?.delay} step={50} onChange={(v) => patchAnimation("delay", v)} />
          <SelectRow label="Repeat" value={node.animation?.repeat ?? "once"} options={["once", "loop"]} onChange={(v) => patchAnimation("repeat", v)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------- Control inputs ---------------------- */

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumRow({ label, value, onChange, step = 1, min, max }: { label: string; value: number | undefined; onChange: (v: number) => void; step?: number | undefined; min?: number | undefined; max?: number | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        className="h-8 w-24 text-xs"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />

    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-16 rounded border bg-background" />
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs">{label}</Label>
      <select
        className="h-8 rounded-md border bg-background px-2 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ControlInput({
  ctl,
  value,
  onChange,
  code,
}: {
  ctl: ControlDef;
  value: unknown;
  onChange: (v: unknown) => void;
  code: string;
}) {
  switch (ctl.type) {
    case "textarea":
    case "list":
      return (
        <div className="space-y-1">
          <Label className="text-xs">{ctl.label}</Label>
          <Textarea className="min-h-20 text-xs" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return (
        <NumRow
          label={ctl.label}
          value={typeof value === "number" ? value : undefined}
          onChange={(v) => {
            let n = Number.isFinite(v) ? v : (ctl.min ?? 0);
            if (ctl.min !== undefined) n = Math.max(ctl.min, n);
            if (ctl.max !== undefined) n = Math.min(ctl.max, n);
            onChange(n);
          }}
          min={ctl.min}
          max={ctl.max}
        />
      );

    case "toggle":
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{ctl.label}</Label>
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return <SelectRow label={ctl.label} value={String(value ?? ctl.options?.[0] ?? "")} options={ctl.options ?? []} onChange={onChange} />;
    case "color":
      return <ColorRow label={ctl.label} value={String(value ?? "#000000")} onChange={onChange} />;
    case "image":
      return <ImageInput label={ctl.label} value={String(value ?? "")} onChange={onChange} code={code} />;
    case "photos":
      return <PhotosInput value={Array.isArray(value) ? (value as Photo[]) : []} onChange={onChange} code={code} />;
    default:
      return <FieldInput label={ctl.label} value={String(value ?? "")} onChange={onChange} />;
  }
}

function useUpload(code: string) {
  const upload = useServerFn(uploadMedia);
  return useCallback(
    async (file: File) => {
      const buf = await file.arrayBuffer();
      let bin = "";
      new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
      const res = await upload({
        data: { code, fileName: file.name, base64: btoa(bin), contentType: file.type || "image/jpeg" },
      });
      return res.url;
    },
    [code, upload],
  );
}

function ImageInput({ label, value, onChange, code }: { label: string; value: string; onChange: (v: string) => void; code: string }) {
  const upload = useUpload(code);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-xs" placeholder="Paste image URL" value={value} onChange={(e) => onChange(e.target.value)} />
      <input
        type="file"
        accept="image/*,video/*,audio/*"
        className="w-full text-[11px]"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          upload(file)
            .then(onChange)
            .catch(() => toast.error("Upload gagal"))
            .finally(() => setBusy(false));
        }}
      />
      {busy ? <p className="text-[11px] text-muted-foreground">Mengunggah...</p> : null}
      {value ? <img src={value} alt="" className="h-16 w-full rounded object-cover" /> : null}
    </div>
  );
}

function PhotosInput({ value, onChange, code }: { value: Photo[]; onChange: (v: Photo[]) => void; code: string }) {
  const upload = useUpload(code);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const set = (i: number, patch: Partial<Photo>) => onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Foto ({value.length})</Label>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onChange([...value, { id: uid("ph"), url: "" }])}>
          ＋ Tambah Foto
        </Button>
      </div>
      {value.map((p, i) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIdx === null) return;
            const next = [...value];
            const [it] = next.splice(dragIdx, 1);
            if (it) next.splice(i, 0, it);
            onChange(next);
            setDragIdx(null);
          }}
          className="space-y-1 rounded border p-2"
        >
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">⋮⋮ Foto {i + 1}</span>
            <div className="ml-auto flex gap-1">
              <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => onChange([...value.slice(0, i + 1), { ...p, id: uid("ph") }, ...value.slice(i + 1)])}>
                Duplicate
              </button>
              <button type="button" className="text-[11px] text-destructive" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                Hapus
              </button>
            </div>
          </div>
          <Input className="h-7 text-[11px]" placeholder="Image URL" value={p.url} onChange={(e) => set(i, { url: e.target.value })} />
          <input
            type="file"
            accept="image/*"
            className="w-full text-[11px]"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              upload(file)
                .then((url) => set(i, { url }))
                .catch(() => toast.error("Upload gagal"));
            }}
          />
          {p.url ? <img src={p.url} alt="" className="h-14 w-full rounded object-cover" /> : null}
        </div>
      ))}
    </div>
  );
}
