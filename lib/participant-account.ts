import type { SupabaseClient } from "@supabase/supabase-js";
import { nextParticipantEmail } from "./participant-email";

/** Kolom peserta pada tabel profiles (bekas tabel guests). */
export interface ParticipantFields {
  nama: string;
  perwakilan_daerah: string;
  jabatan?: string | null;
  departemen?: string | null;
  kategori?: string | null;
  ukuran_baju?: string | null;
  mode_kehadiran?: string | null;
  legacy_guest_id?: string | null;
  created_at?: string | null;
}

export type CreateParticipantResult =
  | { ok: true; id: string; email: string }
  | { ok: false; error: string; code?: "duplicate_person" | "email" | "profile" };

const MAX_EMAIL_ATTEMPTS = 50;

/** Password awal akun peserta bila PARTICIPANT_DEFAULT_PASSWORD tidak diatur. */
export const DEFAULT_PARTICIPANT_PASSWORD = "www.bmh.or.id";

export function getParticipantPassword(): string {
  return process.env.PARTICIPANT_DEFAULT_PASSWORD || DEFAULT_PARTICIPANT_PASSWORD;
}

function emptyToNull<T extends string | null | undefined>(value: T): string | null {
  const v = typeof value === "string" ? value.trim() : value;
  return v ? (v as string) : null;
}

/** Baris profiles untuk peserta (nilai kosong menjadi null). */
export function participantRow(fields: ParticipantFields) {
  const row: Record<string, string | null> = {
    nama: fields.nama.trim(),
    perwakilan_daerah: fields.perwakilan_daerah.trim(),
    jabatan: emptyToNull(fields.jabatan),
    departemen: emptyToNull(fields.departemen),
    kategori: emptyToNull(fields.kategori) ?? "daerah",
    ukuran_baju: emptyToNull(fields.ukuran_baju),
    mode_kehadiran: emptyToNull(fields.mode_kehadiran),
    legacy_guest_id: emptyToNull(fields.legacy_guest_id),
  };
  const createdAt = emptyToNull(fields.created_at);
  if (createdAt) row.created_at = createdAt;
  return row;
}

/**
 * Membuat akun Supabase Auth (email terkonfirmasi) + mengisi profil peserta, role `peserta`.
 * Email: `email` bila diberikan, jika tidak dari nama depan; bila sudah dipakai, nomor berurutan dicoba.
 * Bila pengisian profil gagal, akun yang baru dibuat dihapus kembali (tanpa akun setengah jadi).
 * `db` HARUS klien service role.
 */
export async function createParticipantAccount(
  db: SupabaseClient,
  input: { fields: ParticipantFields; password: string; email?: string }
): Promise<CreateParticipantResult> {
  const taken = new Set<string>();
  let email = (input.email ?? nextParticipantEmail(input.fields.nama, taken)).toLowerCase();
  let created: { id: string } | null = null;

  for (let attempt = 0; attempt < MAX_EMAIL_ATTEMPTS && !created; attempt += 1) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });
    if (!error && data?.user) {
      created = { id: data.user.id };
      break;
    }
    const exists = error && (error.code === "email_exists" || error.code === "user_already_exists" || /already|registered/i.test(error.message));
    if (!exists) return { ok: false, error: error?.message ?? "Gagal membuat akun.", code: "email" };
    taken.add(email);
    email = nextParticipantEmail(input.fields.nama, taken);
  }
  if (!created) return { ok: false, error: "Tidak menemukan email yang tersedia.", code: "email" };

  // Trigger database sudah membuat baris profil (role peserta); lengkapi dengan data peserta.
  const { error: profileError } = await db
    .from("profiles")
    .upsert({ id: created.id, email, role: "peserta", ...participantRow(input.fields) }, { onConflict: "id" });
  if (profileError) {
    await db.auth.admin.deleteUser(created.id);
    return profileError.code === "23505"
      ? { ok: false, error: "Peserta dengan nama dan perwakilan yang sama sudah ada.", code: "duplicate_person" }
      : { ok: false, error: profileError.message, code: "profile" };
  }
  return { ok: true, id: created.id, email };
}
