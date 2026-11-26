"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { toSnake, type ContentKind } from "@/lib/content/admin-config";
import {
  CONTENT_BUCKET, CONTENT_TAGS, albumSchema, contactSchema, contentImageError, fieldErrorsOf, idSchema,
  infoSchema, materiSchema, notulaSchema, occupantsSchema, roomSchema, type ContentResult,
} from "@/lib/content/schema";

const DENIED: ContentResult = { success: false, error: "Sesi admin berakhir. Silakan login ulang sebagai admin." };

const KINDS: Record<ContentKind, { table: string; schema: z.ZodType<Record<string, unknown>>; tag: string; paths: string[] }> = {
  room: { table: "hotel_rooms", schema: roomSchema, tag: CONTENT_TAGS.hotel, paths: ["/informasi-kamar-hotel", "/kelola-konten/kamar-hotel"] },
  info: { table: "hotel_info_items", schema: infoSchema, tag: CONTENT_TAGS.hotel, paths: ["/informasi-kamar-hotel", "/kelola-konten/kamar-hotel"] },
  album: { table: "gallery_albums", schema: albumSchema, tag: CONTENT_TAGS.galeri, paths: ["/publikasi/foto-galeri-kegiatan", "/kelola-konten/foto-galeri"] },
  materi: { table: "presentation_materials", schema: materiSchema, tag: CONTENT_TAGS.materi, paths: ["/publikasi/materi-presentasi-rakernas", "/kelola-konten/materi-presentasi"] },
  notula: { table: "meeting_minutes", schema: notulaSchema, tag: CONTENT_TAGS.notula, paths: ["/publikasi/notula-rapat", "/kelola-konten/notula-rapat"] },
};

async function requireAdmin() {
  return getAdminUser(await createClient());
}

function refresh(tag: string, paths: string[]) {
  updateTag(tag);
  for (const p of paths) revalidatePath(p);
}

/** Pesan galat Postgres -> bahasa pengguna (trigger kamar memakai pesan sendiri). */
function dbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Data dengan nilai tersebut sudah ada (misalnya nomor kamar duplikat).";
  if (error.code === "23514" && /Penghuni|penuh|Kapasitas/i.test(error.message)) return error.message;
  if (error.code === "23514") return "Data tidak memenuhi aturan validasi.";
  return "Gagal menyimpan ke database. Coba lagi.";
}

/** Tambah (id kosong) atau ubah satu baris konten. */
export async function saveContent(kind: ContentKind, formData: FormData): Promise<ContentResult> {
  if (!(await requireAdmin())) return DENIED;
  const cfg = KINDS[kind];
  if (!cfg) return { success: false, error: "Jenis konten tidak dikenal." };

  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const idRaw = raw.id;
  delete raw.id;
  const parsed = cfg.schema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Periksa kembali isian form.", fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const id = idRaw ? idSchema.safeParse(idRaw) : null;
  if (id && !id.success) return { success: false, error: "ID tidak valid." };

  const db = createAdminClient();
  const values: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) values[toSnake(k)] = v;

  // Sampul album: upload ke bucket 'konten'; wajib saat tambah.
  let oldCover: string | null = null;
  if (kind === "album") {
    const file = formData.get("cover");
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile && !id) return { success: false, error: "Periksa kembali isian form.", fieldErrors: { cover: "Foto sampul wajib diunggah." } };
    if (hasFile) {
      const fileError = contentImageError(file);
      if (fileError) return { success: false, error: fileError, fieldErrors: { cover: fileError } };
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `galeri/${randomUUID()}.${ext}`;
      const up = await db.storage.from(CONTENT_BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) return { success: false, error: "Gagal mengunggah foto sampul." };
      values.cover_path = path;
      if (id) {
        const { data } = await db.from(cfg.table).select("cover_path").eq("id", id.data).maybeSingle();
        oldCover = (data?.cover_path as string | undefined) ?? null;
      }
    }
  }

  const { error } = id
    ? await db.from(cfg.table).update(values).eq("id", id.data)
    : await db.from(cfg.table).insert(values);
  if (error) {
    if (typeof values.cover_path === "string") await db.storage.from(CONTENT_BUCKET).remove([values.cover_path]);
    return { success: false, error: dbError(error) };
  }
  if (oldCover && !oldCover.startsWith("/")) await db.storage.from(CONTENT_BUCKET).remove([oldCover]);

  refresh(cfg.tag, cfg.paths);
  return { success: true };
}

export async function deleteContent(kind: ContentKind, rawId: unknown): Promise<ContentResult> {
  if (!(await requireAdmin())) return DENIED;
  const cfg = KINDS[kind];
  const id = idSchema.safeParse(rawId);
  if (!cfg || !id.success) return { success: false, error: "Data tidak valid." };

  const db = createAdminClient();
  const { data, error } = await db.from(cfg.table).delete().eq("id", id.data).select("*").maybeSingle();
  if (error) return { success: false, error: dbError(error) };
  const cover = (data as { cover_path?: string } | null)?.cover_path;
  if (cover && !cover.startsWith("/")) await db.storage.from(CONTENT_BUCKET).remove([cover]);

  refresh(cfg.tag, cfg.paths);
  return { success: true };
}

/** Ganti seluruh penghuni satu kamar (semua role kecuali user; dicek juga oleh trigger DB). */
export async function setRoomOccupants(input: { roomId: number; profileIds: string[] }): Promise<ContentResult> {
  if (!(await requireAdmin())) return DENIED;
  const parsed = occupantsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Data penghuni tidak valid." };
  const { roomId, profileIds } = parsed.data;
  const unique = [...new Set(profileIds)];

  const db = createAdminClient();
  const { data: room } = await db.from("hotel_rooms").select("id, kapasitas").eq("id", roomId).maybeSingle();
  if (!room) return { success: false, error: "Kamar tidak ditemukan." };
  if (unique.length > room.kapasitas) return { success: false, error: `Kamar hanya muat ${room.kapasitas} penghuni.` };

  if (unique.length) {
    const { data: ok } = await db.from("profiles").select("id").in("id", unique).neq("role", "user").not("nama", "is", null);
    if ((ok ?? []).length !== unique.length) return { success: false, error: "Penghuni harus akun non-user yang sudah punya nama." };
    const { data: taken } = await db.from("hotel_room_occupants").select("profile_id").in("profile_id", unique).neq("room_id", roomId);
    if ((taken ?? []).length) return { success: false, error: "Ada peserta yang sudah menempati kamar lain. Lepaskan dulu dari kamar tersebut." };
  }

  const del = await db.from("hotel_room_occupants").delete().eq("room_id", roomId);
  if (del.error) return { success: false, error: dbError(del.error) };
  if (unique.length) {
    const ins = await db.from("hotel_room_occupants").insert(unique.map((profile_id) => ({ room_id: roomId, profile_id })));
    if (ins.error) return { success: false, error: dbError(ins.error) };
  }

  refresh(CONTENT_TAGS.hotel, KINDS.room.paths);
  return { success: true };
}

export async function saveHotelContact(formData: FormData): Promise<ContentResult> {
  if (!(await requireAdmin())) return DENIED;
  const parsed = contactSchema.safeParse({ nama: formData.get("nama") ?? "", whatsapp: formData.get("whatsapp") ?? "" });
  if (!parsed.success) return { success: false, error: "Periksa kembali isian form.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  const { error } = await createAdminClient().from("hotel_contact").upsert({ id: 1, ...parsed.data });
  if (error) return { success: false, error: dbError(error) };
  refresh(CONTENT_TAGS.hotel, KINDS.room.paths);
  return { success: true };
}
