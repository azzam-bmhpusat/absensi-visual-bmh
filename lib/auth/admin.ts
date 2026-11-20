import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Klien minimal yang dibutuhkan untuk cek admin (memudahkan pengujian). */
export type AdminCheckClient = Pick<SupabaseClient, "auth" | "rpc">;

/** Hasil cek untuk klien berbasis sesi (cookie): pengguna masuk, dan apakah role-nya admin. */
export interface AdminCheck {
  user: User | null;
  isAdmin: boolean;
}

/**
 * Memeriksa sesi saat ini. `isAdmin` hanya true bila pengguna masuk DAN `public.is_admin()`
 * (role 'admin' di tabel profiles) bernilai true. Gagal = bukan admin (fail-closed), termasuk
 * bila fungsi database belum ada karena migrasi belum dijalankan.
 */
export async function checkAdmin(supabase: AdminCheckClient): Promise<AdminCheck> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, isAdmin: false };

  const { data, error: rpcError } = await supabase.rpc("is_admin");
  return { user, isAdmin: !rpcError && data === true };
}

/** Pengguna yang sedang masuk bila ia admin, selain itu `null`. */
export async function getAdminUser(supabase: AdminCheckClient): Promise<User | null> {
  const { user, isAdmin } = await checkAdmin(supabase);
  return isAdmin ? user : null;
}
