import { ROLE_LABEL, type UserRole } from "@/lib/user-schema";
import { PROFILE_STATUS_LABEL, profileStatus } from "@/lib/profile-contact";

/** Kolom profiles yang dimuat untuk Manajemen User (email & role ada di UserRow). */
export const USER_PROFILE_COLUMNS = [
  "nama",
  /** Nama dari akun Google (privat, migrasi 0018); dipakai bila `nama` belum diisi. */
  "nama_google",
  "perwakilan_daerah",
  "jabatan",
  "kategori",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
  "legacy_guest_id",
  "avatar_url",
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

/** Filter status Manajemen User: semua, per role, atau akun nonaktif. */
export type UserStatusFilter = "all" | UserRole | "inactive";

/** Nilai filter jabatan: ALL_JABATAN, NO_JABATAN, atau teks jabatan. */
export const ALL_JABATAN = "all";
export const NO_JABATAN = "__none__";

/** Filter keterangan kehadiran: semua, offline, online, atau belum diisi. */
export const KEHADIRAN_FILTERS = ["all", "offline", "online", "none"] as const;
export type KehadiranFilter = (typeof KEHADIRAN_FILTERS)[number];

export interface UserFilter {
  status: UserStatusFilter;
  jabatan: string;
  q: string;
  /** Default "all". */
  kehadiran?: KehadiranFilter;
}

/** Field profil yang ikut dicari oleh kotak pencarian. */
const SEARCH_FIELDS = [
  "nama",
  "nama_google",
  "perwakilan_daerah",
  "jabatan",
  "kategori",
  "ukuran_baju",
  "no_whatsapp",
  "keterangan_kehadiran",
] as const satisfies readonly (keyof UserProfile)[];

type SearchableUser = Pick<UserRow, "email" | "role" | "banned" | "profile">;

/** Cocokkan teks bebas ke email, peran, status, dan data profil (tidak peka huruf besar/kecil). */
function matchesSearch(u: SearchableUser, needle: string): boolean {
  const haystack = [
    u.email,
    ROLE_LABEL[u.role],
    u.banned ? "nonaktif" : "aktif",
    PROFILE_STATUS_LABEL[profileStatus(u.profile).status],
    ...SEARCH_FIELDS.map((f) => u.profile[f] ?? ""),
  ]
    .join("\n")
    .toLowerCase();
  if (haystack.includes(needle)) return true;
  // No. WA: "0812 345" atau "0812-345" tetap cocok dengan "0812345...".
  const digits = needle.replace(/\D/g, "");
  return digits.length >= 3 && /^[\d\s+().-]+$/.test(needle) && (u.profile.no_whatsapp ?? "").replace(/\D/g, "").includes(digits);
}

/** Filter yang sama dipakai tabel (client) dan ekspor Excel (server). */
export function filterUsers<T extends SearchableUser>(
  users: T[],
  { status, jabatan, q, kehadiran = "all" }: UserFilter
): T[] {
  const needle = q.trim().toLowerCase();
  return users.filter((u) => {
    if (status === "inactive" ? !u.banned : status !== "all" && u.role !== status) return false;
    if (jabatan === NO_JABATAN ? u.profile.jabatan : jabatan !== ALL_JABATAN && u.profile.jabatan !== jabatan) return false;
    if (kehadiran !== "all" && (u.profile.keterangan_kehadiran ?? "none") !== kehadiran) return false;
    return !needle || matchesSearch(u, needle);
  });
}
