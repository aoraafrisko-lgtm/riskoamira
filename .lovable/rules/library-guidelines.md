# Wedding Weaver — Guidelines

## Components

The design system exports these components — import them from `@ws-yvvnm447dhiwekcgd29v/dce8dc80-49fe-4dc3-a1f2-5b8b7af1e19b` and compose them before building anything from scratch:

`BgControls`, `BgRemoverDialog`, `Button`, `CanvasStage`, `Constants`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `FieldRenderer`, `FontSelect`, `GuestsManager`, `ImageInput`, `Input`, `InvitationRenderer`, `Label`, `MediaLibraryDialog`, `RenderContext`, `ScrollArea`, `ScrollBar`, `SectionNav`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`, `Sheet`, `TabsContent`, `TabsList`, `TabsTrigger`, `Tabs`, `Textarea`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-yvvnm447dhiwekcgd29v/dce8dc80-49fe-4dc3-a1f2-5b8b7af1e19b/styles.css` (source — preferred import)
- `@ws-yvvnm447dhiwekcgd29v/dce8dc80-49fe-4dc3-a1f2-5b8b7af1e19b/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

