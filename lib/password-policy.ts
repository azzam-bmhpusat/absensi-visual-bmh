import { z } from "zod";
import type { User } from "@supabase/supabase-js";

/**
 * Kunci di `auth.users.raw_app_meta_data`. app_metadata hanya bisa diubah service role,
 * jadi peserta tidak bisa menandai dirinya sendiri "sudah ganti kata sandi".
 */
export const PASSWORD_CHANGED_AT = "password_changed_at";

/** Panjang minimal kata sandi baru peserta. Maksimal 72 = batas bcrypt (sisanya terpotong diam-diam). */
export const NEW_PASSWORD_MIN = 6;
export const NEW_PASSWORD_MAX = 72;

/** Peserta wajib mengganti kata sandi awal (dari admin/default) sebelum membuka halaman peserta. */
export function mustChangePassword(user: Pick<User, "app_metadata">, role: string | null | undefined): boolean {
  if (role !== "peserta") return false;
  return !user.app_metadata?.[PASSWORD_CHANGED_AT];
}

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Kata sandi saat ini wajib diisi").max(NEW_PASSWORD_MAX, "Kata sandi saat ini tidak valid"),
    next: z
      .string()
      .min(NEW_PASSWORD_MIN, `Kata sandi baru minimal ${NEW_PASSWORD_MIN} karakter`)
      .max(NEW_PASSWORD_MAX, `Kata sandi baru maksimal ${NEW_PASSWORD_MAX} karakter`),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Konfirmasi kata sandi tidak sama" });
