import type { UserRole } from "@/lib/user-schema";

/** Kolom profiles yang dimuat untuk Manajemen User (email & role ada di UserRow). */
export const USER_PROFILE_COLUMNS = [
  "nama",
  "perwakilan_daerah",
  "jabatan",
  "departemen",
  "kategori",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
  "mode_kehadiran",
  "legacy_guest_id",
  "updated_at",
] as const;

export type UserProfile = Record<(typeof USER_PROFILE_COLUMNS)[number], string | null>;

export const EMPTY_PROFILE: UserProfile = Object.fromEntries(
  USER_PROFILE_COLUMNS.map((c) => [c, null])
) as UserProfile;

/** Satu baris pada tabel Manajemen User (gabungan auth.users + profiles). */
export interface UserRow {
  id: string;
  email: string;
  role: UserRole;
  /** Data peserta dari tabel profiles; kolom kosong bernilai null. */
  profile: UserProfile;
  /** true bila akun dinonaktifkan (diblokir) di Supabase Auth. */
  banned: boolean;
  lastSignInAt: string | null;
  createdAt: string;
}

export function formatUserDate(iso: string | null): string {
  if (!iso) return "Belum pernah";
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tanda "diblokir" Supabase: banned_until di masa depan. */
export function isBanned(bannedUntil: string | null | undefined, now = Date.now()): boolean {
  if (!bannedUntil) return false;
  const t = Date.parse(bannedUntil);
  return Number.isFinite(t) && t > now;
}
