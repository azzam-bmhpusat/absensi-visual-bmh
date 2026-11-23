import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_ROLE, toUserRole } from "@/lib/user-schema";
import { EMPTY_PROFILE, isBanned, USER_PROFILE_COLUMNS, type UserProfile, type UserRow } from "@/lib/user-row";

/**
 * Semua akun (auth.users + profiles) untuk Manajemen User, terbaru dulu. Memakai service role,
 * jadi pemanggil WAJIB sudah memastikan sesi admin. Mengembalikan null bila gagal dimuat.
 */
export async function loadUsers(): Promise<UserRow[] | null> {
  try {
    const db = createAdminClient();
    const [listRes, profilesRes] = await Promise.all([
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      db.from("profiles").select(["id", "role", ...USER_PROFILE_COLUMNS].join(", ")),
    ]);
    if (listRes.error || profilesRes.error) {
      console.error("Gagal memuat pengguna:", listRes.error?.message, profilesRes.error?.message);
      return null;
    }
    const rows = (profilesRes.data ?? []) as unknown as Record<string, unknown>[];
    const profiles = new Map(
      rows.map((p) => [
        p.id as string,
        {
          role: toUserRole(p.role),
          profile: Object.fromEntries(
            USER_PROFILE_COLUMNS.map((c) => {
              const v = p[c];
              return [c, typeof v === "string" && v.trim() ? v.trim() : null];
            })
          ) as UserProfile,
        },
      ])
    );
    return listRes.data.users
      .map<UserRow>((u) => ({
        id: u.id,
        email: u.email ?? "(tanpa email)",
        role: profiles.get(u.id)?.role ?? DEFAULT_ROLE,
        profile: profiles.get(u.id)?.profile ?? EMPTY_PROFILE,
        banned: isBanned(u.banned_until),
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch (error) {
    console.error("Gagal memuat pengguna:", error);
    return null;
  }
}
