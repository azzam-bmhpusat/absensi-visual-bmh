import { z } from "zod";

export const USER_ROLES = ["admin", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  user: "User",
};

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi")
  .max(254, "Email terlalu panjang")
  .pipe(z.email("Format email tidak valid"));

export const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .max(72, "Kata sandi maksimal 72 karakter");

export const roleSchema = z.enum(USER_ROLES, { error: "Peran harus Admin atau User" });

export const userIdSchema = z.string().uuid("ID pengguna tidak valid");

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    role: roleSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((v) => v.email !== undefined || v.role !== undefined || v.password !== undefined, {
    message: "Tidak ada perubahan yang dikirim",
  });

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;

/** Membuat kata sandi acak (tanpa karakter yang mudah tertukar) untuk dibagikan admin ke pengguna baru. */
export function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}
