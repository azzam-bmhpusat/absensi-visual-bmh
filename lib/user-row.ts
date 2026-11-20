import type { UserRole } from "@/lib/user-schema";

/** Satu baris pada tabel Manajemen User (gabungan auth.users + profiles). */
export interface UserRow {
  id: string;
  email: string;
  role: UserRole;
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
