import { Fragment, useRef } from "react";
import { FieldRenderer } from "./FieldRenderer";
import { RenderContext, type RenderCtx } from "./render-context";
import { getDefinition } from "@/lib/builder/registry";
import { resolvePos, styleToCss } from "@/lib/builder/style";
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
          background: theme.bgColor ?? "#fbf8f4",
          color: theme.textColor ?? "#3b332c",
          fontFamily: theme.fontBody ?? "inherit",
          minHeight: "100%",
        }}
      >
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
        ...styleToCss(s),
        backgroundImage: s.bgImage ? `url(${s.bgImage})` : s.bgGradient,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: section.hidden ? 0.4 : (s.opacity ?? 1),
        outline: selected ? "2px solid #b08d57" : undefined,
        outlineOffset: -2,
        cursor: editor ? "pointer" : undefined,
      }}
    >
      {s.bgImage && s.overlay ? (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${s.overlay / 100})` }} />
      ) : null}
      <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
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
  if (sub.hidden && !editor) return null;
  const sel: Selection = { kind: "subsection", sectionId: section.id, subsectionId: sub.id };
  const selected = isSelected(hooks?.selection, sel);
  const layout = sub.layout ?? "stack";
  const free = layout === "free";
  const columns =
    ctxBp === "mobile" ? 1 : layout === "grid-3" ? 3 : layout === "grid-2" || layout === "row" ? 2 : 1;

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
        ...styleToCss(sub.style ?? {}),
        opacity: sub.hidden ? 0.4 : (sub.style?.opacity ?? 1),
        outline: selected ? "2px dashed #b08d57" : undefined,
        outlineOffset: -2,
      }}
    >
      {editor && selected ? <Badge label={sub.name} toolbar={hooks?.toolbar?.(sel)} /> : null}
      {free ? (
        <FreeCanvas section={section} sub={sub} editor={editor} hooks={hooks} bp={ctxBp} />
      ) : (
        <div
          style={{
            display: columns > 1 ? "grid" : "flex",
            gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0,1fr))` : undefined,
            flexDirection: "column",
            gap: 14,
            alignItems: columns > 1 ? "center" : undefined,
          }}
        >
          {sub.fields.map((field) => (
            <FieldWrap key={field.id} section={section} sub={sub} field={field} editor={editor} hooks={hooks} />
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
