import { uid } from "./types";
import type { FieldNode, InvitationConfig, Photo, SectionNode, SubsectionNode } from "./types";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const reId = (node: SectionNode | SubsectionNode | FieldNode): void => {
  if ("subsections" in node) {
    node.id = uid("sec");
    node.subsections.forEach(reId);
  } else if ("fields" in node) {
    node.id = uid("sub");
    node.fields.forEach(reId);
  } else {
    node.id = uid("f");
  }
};

export const duplicateNode = <T extends SectionNode | SubsectionNode | FieldNode>(node: T): T => {
  const copy = clone(node);
  reId(copy);
  return copy;
};

const moveInArray = <T,>(arr: T[], from: number, to: number): T[] => {
  const next = [...arr];
  const item = next[from];
  if (item === undefined) return arr;
  next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
};

export const mapSections = (
  config: InvitationConfig,
  fn: (s: SectionNode) => SectionNode,
): InvitationConfig => ({ ...config, sections: config.sections.map(fn) });

export const updateSection = (
  config: InvitationConfig,
  sectionId: string,
  patch: Partial<SectionNode>,
): InvitationConfig => mapSections(config, (s) => (s.id === sectionId ? { ...s, ...patch } : s));

export const updateSubsection = (
  config: InvitationConfig,
  sectionId: string,
  subId: string,
  patch: Partial<SubsectionNode>,
): InvitationConfig =>
  mapSections(config, (s) =>
    s.id !== sectionId
      ? s
      : { ...s, subsections: s.subsections.map((sub) => (sub.id === subId ? { ...sub, ...patch } : sub)) },
  );

export const updateField = (
  config: InvitationConfig,
  sectionId: string,
  subId: string,
  fieldId: string,
  patch: Partial<FieldNode>,
): InvitationConfig =>
  mapSections(config, (s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          subsections: s.subsections.map((sub) =>
            sub.id !== subId
              ? sub
              : { ...sub, fields: sub.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) },
          ),
        },
  );

export const removeSection = (config: InvitationConfig, sectionId: string): InvitationConfig => ({
  ...config,
  sections: config.sections.filter((s) => s.id !== sectionId),
});

export const removeSubsection = (config: InvitationConfig, sectionId: string, subId: string) =>
  mapSections(config, (s) =>
    s.id !== sectionId ? s : { ...s, subsections: s.subsections.filter((sub) => sub.id !== subId) },
  );

export const removeField = (
  config: InvitationConfig,
  sectionId: string,
  subId: string,
  fieldId: string,
) =>
  mapSections(config, (s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          subsections: s.subsections.map((sub) =>
            sub.id !== subId ? sub : { ...sub, fields: sub.fields.filter((f) => f.id !== fieldId) },
          ),
        },
  );

export const insertSection = (config: InvitationConfig, section: SectionNode, at?: number) => {
  const sections = [...config.sections];
  sections.splice(at ?? sections.length, 0, section);
  return { ...config, sections };
};

export const insertSubsection = (
  config: InvitationConfig,
  sectionId: string,
  sub: SubsectionNode,
  at?: number,
) =>
  mapSections(config, (s) => {
    if (s.id !== sectionId) return s;
    const subsections = [...s.subsections];
    subsections.splice(at ?? subsections.length, 0, sub);
    return { ...s, subsections };
  });

export const insertField = (
  config: InvitationConfig,
  sectionId: string,
  subId: string,
  field: FieldNode,
  at?: number,
) =>
  mapSections(config, (s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          subsections: s.subsections.map((sub) => {
            if (sub.id !== subId) return sub;
            const fields = [...sub.fields];
            fields.splice(at ?? fields.length, 0, field);
            return { ...sub, fields };
          }),
        },
  );

export const reorderSections = (config: InvitationConfig, from: number, to: number) => ({
  ...config,
  sections: moveInArray(config.sections, from, to),
});

export const reorderSubsections = (config: InvitationConfig, sectionId: string, from: number, to: number) =>
  mapSections(config, (s) => (s.id !== sectionId ? s : { ...s, subsections: moveInArray(s.subsections, from, to) }));

export const reorderFields = (
  config: InvitationConfig,
  sectionId: string,
  subId: string,
  from: number,
  to: number,
) =>
  mapSections(config, (s) =>
    s.id !== sectionId
      ? s
      : {
          ...s,
          subsections: s.subsections.map((sub) =>
            sub.id !== subId ? sub : { ...sub, fields: moveInArray(sub.fields, from, to) },
          ),
        },
  );

export const findSection = (config: InvitationConfig, id?: string) =>
  config.sections.find((s) => s.id === id);
export const findSubsection = (config: InvitationConfig, sectionId?: string, subId?: string) =>
  findSection(config, sectionId)?.subsections.find((s) => s.id === subId);
export const findField = (
  config: InvitationConfig,
  sectionId?: string,
  subId?: string,
  fieldId?: string,
) => findSubsection(config, sectionId, subId)?.fields.find((f) => f.id === fieldId);

export const newPhoto = (url = ""): Photo => ({ id: uid("ph"), url });
