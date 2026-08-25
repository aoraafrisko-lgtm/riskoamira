import { Fragment, useEffect, useRef, useState } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { RenderContext, type RenderCtx } from "./render-context";
import { getDefinition } from "@/lib/builder/registry";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/builder/canvas";
import { bgLayerStyle, resolvePos, scaleStyle, styleToCss } from "@/lib/builder/style";
import { fontFamilyCss } from "@/lib/builder/fonts";

import type {
  Breakpoint,
  FieldNode,
  FreePos,
  InvitationConfig,
  SectionNode,
  Selection,
  SubsectionNode,
} from "@/lib/builder/types";

export interface EditorHooks {
  selection?: Selection | null;
  onSelect?: (sel: Selection) => void;
  onAddSubsection?: (sectionId: string) => void;
  onAddField?: (sectionId: string, subId: string) => void;
  onAddSection?: () => void;
  onInlineEdit?: (sel: Selection, key: string, value: string) => void;
  onMovePos?: (sel: Selection, pos: FreePos) => void;
  toolbar?: (sel: Selection) => React.ReactNode;
}

interface Props {
  config: InvitationConfig;
  ctx: RenderCtx;
  editorHooks?: EditorHooks;
}

const isSelected = (sel: Selection | null | undefined, target: Selection) =>
  !!sel &&
  sel.kind === target.kind &&
  sel.sectionId === target.sectionId &&
  sel.subsectionId === target.subsectionId &&
  sel.fieldId === target.fieldId;

const INLINE_KEYS: Record<string, string> = { heading: "text", text: "text", quote: "text" };

export function InvitationRenderer({ config, ctx, editorHooks }: Props) {
  const editor = ctx.editor;
  const theme = config.theme ?? {};

  return (
    <RenderContext.Provider value={ctx}>
      <div
        style={{
          position: "relative",
          background: "transparent",
          color: theme.textColor ?? "#3b332c",
          fontFamily: fontFamilyCss(theme.fontBody) ?? "inherit",
          width: CANVAS_WIDTH,
          minHeight: "100%",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>


        {config.sections.length === 0 && (
          <div style={{ padding: "80px 24px", textAlign: "center", opacity: 0.7 }}>
            {editor ? (
              <>
                <div style={{ fontSize: 18, marginBottom: 8 }}>Belum ada Section</div>
                <div style={{ fontSize: 13, marginBottom: 16 }}>Mulai buat undangan Anda.</div>
                <button
                  type="button"
                  onClick={() => editorHooks?.onAddSection?.()}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 99,
                    border: "1px dashed currentColor",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  ＋ Tambah Section
                </button>
              </>
            ) : (
              <div style={{ fontSize: 14 }}>Undangan belum dipublikasikan.</div>
            )}
          </div>
        )}

        {config.sections.map((section) => (
          <SectionView key={section.id} section={section} editor={editor} hooks={editorHooks} theme={theme} ctxBp={ctx.breakpoint} />
        ))}
        </div>
      </div>

    </RenderContext.Provider>
  );
}

function SectionView({
  section,
  editor,
  hooks,
  theme,
  ctxBp,
}: {
  section: SectionNode;
  editor: boolean;
  hooks: EditorHooks | undefined;
  theme: InvitationConfig["theme"];
  ctxBp: RenderCtx["breakpoint"];
}) {
  if (section.hidden && !editor) return null;
  const sel: Selection = { kind: "section", sectionId: section.id };
  const selected = isSelected(hooks?.selection, sel);
  const s = section.style ?? {};

  return (
    <section
      data-section-id={section.id}
      onClick={
        editor
          ? (e) => {
              e.stopPropagation();
              hooks?.onSelect?.(sel);
            }
          : undefined
      }
      style={{
        position: "relative",
        ...styleToCss(scaleStyle(s, ctxBp)),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        minHeight: CANVAS_HEIGHT,
        maxHeight: CANVAS_HEIGHT,
        overflow: editor ? "visible" : "hidden",
        opacity: section.hidden ? 0.4 : (s.opacity ?? 1),
        outline: selected ? "2px solid #b08d57" : editor ? "1px dashed rgba(176,141,87,.5)" : undefined,
        outlineOffset: -2,
        cursor: editor ? "pointer" : undefined,
      }}
    >
      {s.bgImage || s.bgGradient ? (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
          <div style={bgLayerStyle(s)} />
          {s.overlay ? (
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${s.overlay / 100})` }} />
          ) : null}
        </div>
      ) : null}
      <div style={{ position: "relative", zIndex: 1, width: "100%", margin: "0 auto" }}>

        {editor && selected ? <Badge label={section.name} toolbar={hooks?.toolbar?.(sel)} /> : null}
        {section.subsections.map((sub) => (
          <SubsectionView
            key={sub.id}
            section={section}
            sub={sub}
            editor={editor}
            hooks={hooks}
            theme={theme}
            ctxBp={ctxBp}
          />
        ))}
        {editor && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hooks?.onAddSubsection?.(section.id);
            }}
            style={dashedBtn}
          >
            ＋ Tambah Subsection
          </button>
        )}
      </div>
    </section>
  );
}

function SubsectionView({
  section,
  sub,
  editor,
  hooks,
  ctxBp,
}: {
  section: SectionNode;
  sub: SubsectionNode;
  editor: boolean;
  hooks: EditorHooks | undefined;
  theme: InvitationConfig["theme"];
  ctxBp: RenderCtx["breakpoint"];
}) {
  const flowRef = useRef<HTMLDivElement | null>(null);
  if (sub.hidden && !editor) return null;
  const sel: Selection = { kind: "subsection", sectionId: section.id, subsectionId: sub.id };
  const selected = isSelected(hooks?.selection, sel);
  const layout = sub.layout ?? "stack";
  const free = layout === "free";
  const columns =
    ctxBp === "mobile" ? 1 : layout === "grid-3" ? 3 : layout === "grid-2" || layout === "row" ? 2 : 1;

  // Field dengan flag `free` boleh keluar dari alur & digerakkan ke mana pun
  const flowFields = free ? [] : sub.fields.filter((f) => !f.free);
  const floatFields = free ? [] : sub.fields.filter((f) => f.free);
  const floatMinHeight = floatFields.reduce((max, f) => {
    const p = resolvePos(f, ctxBp);
    return Math.max(max, (p.y ?? 0) + 90);
  }, 0);

  return (
    <div
      data-sub-id={sub.id}
      onClick={
        editor
          ? (e) => {
              e.stopPropagation();
              hooks?.onSelect?.(sel);
            }
          : undefined
      }
      style={{
        position: "relative",
        ...styleToCss(scaleStyle(sub.style ?? {}, ctxBp)),
        opacity: sub.hidden ? 0.4 : (sub.style?.opacity ?? 1),
        outline: selected ? "2px dashed #b08d57" : undefined,
        outlineOffset: -2,
      }}
    >
      {sub.style?.bgImage || sub.style?.bgGradient ? (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, borderRadius: sub.style?.radius }}>
          <div style={bgLayerStyle(sub.style ?? {})} />
          {sub.style?.overlay ? (
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${sub.style.overlay / 100})` }} />
          ) : null}
        </div>
      ) : null}
      {editor && selected ? <Badge label={sub.name} toolbar={hooks?.toolbar?.(sel)} /> : null}

      {free ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <FreeCanvas section={section} sub={sub} editor={editor} hooks={hooks} bp={ctxBp} />
        </div>
      ) : (
        <div ref={flowRef} style={{ position: "relative", zIndex: 1, minHeight: floatMinHeight || undefined }}>

          <div
            style={{
              display: columns > 1 ? "grid" : "flex",
              gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0,1fr))` : undefined,
              flexDirection: "column",
              gap: ctxBp === "mobile" ? 12 : 14,
              alignItems: columns > 1 ? "center" : undefined,
            }}
          >
            {flowFields.map((field) => (
              <FieldWrap key={field.id} section={section} sub={sub} field={field} editor={editor} hooks={hooks} />
            ))}
          </div>
          {floatFields.map((field) => (
            <FreeField
              key={field.id}
              section={section}
              sub={sub}
              field={field}
              editor={editor}
              hooks={hooks}
              bp={ctxBp}
              canvasRef={flowRef}
            />
          ))}
        </div>
      )}
      {editor && sub.fields.length === 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hooks?.onAddField?.(section.id, sub.id);
          }}
          style={dashedBtn}
        >
          ＋ Tambah Field
        </button>
      )}
      {editor && sub.fields.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hooks?.onAddField?.(section.id, sub.id);
          }}
          style={{ ...dashedBtn, opacity: 0.5, padding: "6px 12px", fontSize: 11 }}
        >
          ＋ Field
        </button>
      )}
    </div>
  );
}

/* ---------- Free (drag anywhere) canvas ---------- */

function FreeCanvas({
  section,
  sub,
  editor,
  hooks,
  bp,
}: {
  section: SectionNode;
  sub: SubsectionNode;
  editor: boolean;
  hooks: EditorHooks | undefined;
  bp: Breakpoint;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const height = sub.canvasHeight ?? 420;
  // di layout free pun, field yang di-"Rapikan" (free === false) kembali ke alur normal
  const flowFields = sub.fields.filter((f) => f.free === false);
  const floatFields = sub.fields.filter((f) => f.free !== false);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "relative",
        height,
        backgroundImage: editor
          ? "linear-gradient(to right, rgba(176,141,87,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(176,141,87,.12) 1px, transparent 1px)"
          : undefined,
        backgroundSize: "20px 20px",
      }}
    >
      {flowFields.length ? (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {flowFields.map((field) => (
            <FieldWrap key={field.id} section={section} sub={sub} field={field} editor={editor} hooks={hooks} />
          ))}
        </div>
      ) : null}
      {floatFields.map((field) => (
        <FreeField
          key={field.id}
          section={section}
          sub={sub}
          field={field}
          editor={editor}
          hooks={hooks}
          bp={bp}
          canvasRef={canvasRef}
        />
      ))}
    </div>
  );
}

function FreeField({
  section,
  sub,
  field,
  editor,
  hooks,
  bp,
  canvasRef,
}: {
  section: SectionNode;
  sub: SubsectionNode;
  field: FieldNode;
  editor: boolean;
  hooks: EditorHooks | undefined;
  bp: Breakpoint;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const sel: Selection = { kind: "field", sectionId: section.id, subsectionId: sub.id, fieldId: field.id };
  const selected = isSelected(hooks?.selection, sel);
  const pos = resolvePos(field, bp);
  const def = getDefinition(field.type);
  const [dragging, setDragging] = useState(false);

  // Nudge dengan tombol panah saat field terpilih (Shift = 10x lebih cepat)
  useEffect(() => {
    if (!editor || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (!keys.includes(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return;
      e.preventDefault();
      const stepPct = e.shiftKey ? 2 : 0.5;
      const stepPx = e.shiftKey ? 10 : 2;
      const next: FreePos =
        e.key === "ArrowLeft"
          ? { ...pos, x: Math.round((pos.x - stepPct) * 10) / 10 }
          : e.key === "ArrowRight"
            ? { ...pos, x: Math.round((pos.x + stepPct) * 10) / 10 }
            : e.key === "ArrowUp"
              ? { ...pos, y: pos.y - stepPx }
              : { ...pos, y: pos.y + stepPx };
      hooks?.onMovePos?.(sel, next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (field.hidden && !editor) return null;

  const boxRef = useRef<HTMLDivElement | null>(null);

  const startDrag = (e: React.PointerEvent, mode: "move" | ResizeDir) => {
    if (!editor) return;
    e.preventDefault();
    e.stopPropagation();
    hooks?.onSelect?.(sel);
    const el = canvasRef.current;
    const rect = el?.getBoundingClientRect();
    if (!el || !rect) return;
    // kanvas diskalakan (transform), jadi px layar harus dibagi skala
    const zoom = el.offsetWidth ? rect.width / el.offsetWidth : 1;
    const startX = e.clientX;
    const startY = e.clientY;
    // tinggi awal: dari nilai tersimpan, atau tinggi terukur saat ini (auto -> tetap)
    const measuredH = boxRef.current ? Math.round(boxRef.current.offsetHeight) : 80;
    const base: Required<Pick<FreePos, "x" | "y" | "w" | "h">> & FreePos = {
      ...pos,
      x: pos.x ?? 0,
      y: pos.y ?? 0,
      w: pos.w ?? 40,
      h: pos.h ?? measuredH,
    };
    const ratio = base.h > 0 ? base.w / base.h : 1;
    setDragging(true);
    const onMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dy = (ev.clientY - startY) / (zoom || 1);
      const snap = ev.shiftKey;
      let next: FreePos;
      if (mode === "move") {
        next = {
          ...base,
          h: pos.h, // jangan paksa tinggi tetap saat hanya digeser
          x: Math.max(-60, Math.min(160, snap ? Math.round((base.x + dxPct) / 5) * 5 : Math.round((base.x + dxPct) * 10) / 10)),
          y: snap ? Math.round((base.y + dy) / 10) * 10 : Math.round(base.y + dy),
        };
      } else {
        let { x, y, w, h } = base;
        if (mode.includes("e")) w = base.w + dxPct;
        if (mode.includes("w")) {
          w = base.w - dxPct;
          x = base.x + dxPct;
        }
        if (mode.includes("s")) h = base.h + dy;
        if (mode.includes("n")) {
          h = base.h - dy;
          y = base.y + dy;
        }
        // Shift di sudut = jaga rasio
        if (snap && mode.length === 2) {
          const hFromW = w / (ratio || 1);
          if (mode.includes("n")) y = base.y + (base.h - hFromW);
          h = hFromW;
        }
        w = Math.max(3, Math.min(200, w));
        h = Math.max(16, h);
        next = { ...base, x: Math.round(x * 10) / 10, y: Math.round(y), w: Math.round(w * 10) / 10, h: Math.round(h) };
      }
      hooks?.onMovePos?.(sel, next);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const wrapper: React.CSSProperties = {
    position: "absolute",
    left: `${pos.x}%`,
    top: pos.y,
    width: `${pos.w}%`,
    ...(pos.h ? { height: pos.h, overflow: "hidden" } : {}),
    zIndex: pos.z ?? field.style?.zIndex ?? 1,
    opacity: field.hidden ? 0.4 : 1,
  };

  if (!editor)
    return (
      <div style={wrapper}>
        <FieldRenderer field={field} />
      </div>
    );

  return (
    <div
      style={{
        ...wrapper,
        zIndex: (typeof wrapper.zIndex === "number" ? wrapper.zIndex : 1) + (selected ? 20 : 0),
        outline: selected ? "2px solid #b08d57" : "1px dashed rgba(176,141,87,.45)",
        outlineOffset: 2,
        boxShadow: dragging ? "0 10px 30px rgba(0,0,0,.18)" : undefined,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={(e) => startDrag(e, "move")}
      onClick={(e) => {
        e.stopPropagation();
        hooks?.onSelect?.(sel);
      }}
    >
      {selected ? <Badge label={`✥ ${def?.name ?? field.type}`} toolbar={hooks?.toolbar?.(sel)} /> : null}
      <FieldRenderer field={field} />
      {dragging ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: -22,
            zIndex: 40,
            background: "#3b332c",
            color: "#fff",
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 5,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          x {pos.x}% · y {pos.y}px · w {pos.w}%
        </div>
      ) : null}
      {selected ? (
        <div
          onPointerDown={(e) => startDrag(e, "resize")}
          style={{
            position: "absolute",
            right: -9,
            bottom: -9,
            width: 18,
            height: 18,
            borderRadius: 5,
            border: "2px solid #fff",
            background: "#b08d57",
            cursor: "ew-resize",
            touchAction: "none",
            zIndex: 32,
          }}
        />
      ) : null}
    </div>
  );
}

function FieldWrap({
  section,
  sub,
  field,
  editor,
  hooks,
}: {
  section: SectionNode;
  sub: SubsectionNode;
  field: FieldNode;
  editor: boolean;
  hooks: EditorHooks | undefined;
}) {
  if (field.hidden && !editor) return null;
  const sel: Selection = { kind: "field", sectionId: section.id, subsectionId: sub.id, fieldId: field.id };
  const selected = isSelected(hooks?.selection, sel);
  const def = getDefinition(field.type);
  const inlineKey = def ? INLINE_KEYS[def.render] : undefined;

  if (!editor) return <FieldRenderer field={field} />;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        hooks?.onSelect?.(sel);
      }}
      style={{
        position: "relative",
        outline: selected ? "2px solid #b08d57" : undefined,
        outlineOffset: 2,
        borderRadius: 4,
        opacity: field.hidden ? 0.4 : 1,
      }}
    >
      {selected ? <Badge label={def?.name ?? field.type} toolbar={hooks?.toolbar?.(sel)} /> : null}
      {inlineKey && selected ? (
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => hooks?.onInlineEdit?.(sel, inlineKey, e.currentTarget.textContent ?? "")}
          style={{ outline: "none" }}
        >
          <FieldRenderer field={field} />
        </div>
      ) : (
        <FieldRenderer field={field} />
      )}
    </div>
  );
}

function Badge({ label, toolbar }: { label: string; toolbar?: React.ReactNode }) {
  return (
    <Fragment>
      <div
        style={{
          position: "absolute",
          top: -11,
          left: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#b08d57",
          color: "#fff",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {label}
      </div>
      {toolbar ? (
        <div style={{ position: "absolute", top: -13, right: 0, zIndex: 31, fontFamily: "system-ui, sans-serif" }}>
          {toolbar}
        </div>
      ) : null}
    </Fragment>
  );
}

const dashedBtn: React.CSSProperties = {
  display: "block",
  margin: "12px auto 0",
  padding: "8px 16px",
  borderRadius: 99,
  border: "1px dashed currentColor",
  background: "transparent",
  color: "inherit",
  fontSize: 12,
  cursor: "pointer",
  opacity: 0.75,
  fontFamily: "system-ui, sans-serif",
};
