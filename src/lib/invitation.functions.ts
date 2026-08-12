import { createServerFn } from "@tanstack/react-start";
import type { InvitationConfig } from "./builder/types";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const assertCode = async (code: string) => {
  const db = await admin();
  const { data, error } = await db.from("admin_config").select("admin_code").eq("id", "main").single();
  if (error) throw new Error("Gagal memverifikasi kode admin");
  if (!data || data.admin_code !== code) throw new Error("Kode admin salah");
  return db;
};

export const verifyAdminCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    await assertCode(data.code);
    return { ok: true };
  });

export const changeAdminCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; newCode: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    if (data.newCode.trim().length < 4) throw new Error("Kode baru minimal 4 karakter");
    const { error } = await db
      .from("admin_config")
      .update({ admin_code: data.newCode.trim(), updated_at: new Date().toISOString() })
      .eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDraftConfig = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { data: row, error } = await db
      .from("invitation")
      .select("draft_config, published_config, updated_at")
      .eq("id", "main")
      .single();
    if (error) throw new Error(error.message);
    return {
      draft: row?.draft_config as unknown as InvitationConfig,
      published: (row?.published_config ?? null) as unknown as InvitationConfig | null,
    };
  });

export const saveDraftConfig = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; config: InvitationConfig }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { error } = await db
      .from("invitation")
      .update({ draft_config: data.config as never, updated_at: new Date().toISOString() })
      .eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true, savedAt: new Date().toISOString() };
  });

export const publishInvitation = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; config: InvitationConfig }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { error } = await db
      .from("invitation")
      .update({
        draft_config: data.config as never,
        published_config: data.config as never,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: renders the invitation for visitors. */
export const getPublicInvitation = createServerFn({ method: "GET" })
  .inputValidator((d: { token?: string }) => d ?? {})
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("invitation")
      .select("published_config, draft_config")
      .eq("id", "main")
      .single();
    const config = (row?.published_config ?? row?.draft_config ?? null) as unknown as InvitationConfig | null;
    let guest: { name: string; category: string; greeting: string | null } | null = null;
    if (data?.token) {
      const { data: g } = await db
        .from("guests")
        .select("name, category, greeting")
        .eq("token", data.token)
        .maybeSingle();
      guest = g ?? null;
    }
    return { config, guest };
  });

/* ------------------------- Guests ------------------------- */

export const listGuests = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { data: guests, error } = await db
      .from("guests")
      .select("id, name, token, category, greeting, phone, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return guests ?? [];
  });

const makeToken = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

export const saveGuest = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      code: string;
      guest: { id?: string; name: string; category?: string; greeting?: string; phone?: string };
    }) => d,
  )
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const g = data.guest;
    if (!g.name.trim()) throw new Error("Nama tamu wajib diisi");
    if (g.id) {
      const { error } = await db
        .from("guests")
        .update({
          name: g.name.trim(),
          category: g.category || "Umum",
          greeting: g.greeting ?? null,
          phone: g.phone ?? null,
        })
        .eq("id", g.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await db.from("guests").insert({
      name: g.name.trim(),
      token: makeToken(),
      category: g.category || "Umum",
      greeting: g.greeting ?? null,
      phone: g.phone ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGuest = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; id: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { error } = await db.from("guests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const importGuestsCsv = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; csv: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const lines = data.csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length && /nama|name/i.test(lines[0] ?? "")) lines.shift();
    const rows = lines.map((line) => {
      const [name, category, phone, greeting] = line.split(/[,;]/).map((v) => v?.trim() ?? "");
      return {
        name: name || "Tamu",
        category: category || "Umum",
        phone: phone || null,
        greeting: greeting || null,
        token: makeToken(),
      };
    });
    if (!rows.length) return { ok: true, inserted: 0 };
    const { error } = await db.from("guests").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, inserted: rows.length };
  });

/* ------------------------- RSVP ------------------------- */

export const listRsvps = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const { data: rows, error } = await db
      .from("rsvps")
      .select("id, guest_name, attending, headcount, message, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { token?: string; name: string; attending: boolean; headcount: number; message?: string }) => d,
  )
  .handler(async ({ data }) => {
    const db = await admin();
    if (!data.name.trim()) throw new Error("Nama wajib diisi");
    let guestId: string | null = null;
    if (data.token) {
      const { data: g } = await db.from("guests").select("id").eq("token", data.token).maybeSingle();
      guestId = g?.id ?? null;
    }
    const { error } = await db.from("rsvps").insert({
      guest_id: guestId,
      guest_name: data.name.trim().slice(0, 120),
      attending: data.attending,
      headcount: Math.max(1, Math.min(20, Math.round(data.headcount || 1))),
      message: data.message?.slice(0, 1000) ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listWishes = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data } = await db
    .from("rsvps")
    .select("guest_name, message, attending, created_at")
    .not("message", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
});

/* ------------------------- Media ------------------------- */

export const uploadMedia = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; fileName: string; base64: string; contentType: string }) => d)
  .handler(async ({ data }) => {
    const db = await assertCode(data.code);
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}_${safe}`;
    const { error } = await db.storage.from("media").upload(path, bytes, {
      contentType: data.contentType || "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: signed, error: signErr } = await db.storage
      .from("media")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed) throw new Error(signErr?.message ?? "Gagal membuat URL");
    await db.from("media").insert({ url: signed.signedUrl, kind: data.contentType.split("/")[0] ?? "image", label: safe });
    return { url: signed.signedUrl };
  });
