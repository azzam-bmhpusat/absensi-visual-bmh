import { z } from "zod";
import { normalizeString } from "./normalize";

export const attendanceSchema = z.object({
  sessionId: z.union([z.literal(1), z.literal(2)], {
    error: "Pilih sesi yang valid (Hari 1 atau Hari 2)",
  }),
  guestId: z
    .string()
    .uuid("ID tamu tidak valid")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nama: z
    .string({ error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .transform((val) => normalizeString(val))
    .pipe(
      z
        .string()
        .min(2, "Nama minimal 2 karakter")
        .max(100, "Nama maksimal 100 karakter")
    ),
  perwakilanDaerah: z
    .string({ error: "Perwakilan daerah wajib diisi" })
    .min(1, "Perwakilan daerah wajib diisi")
    .transform((val) => normalizeString(val))
    .pipe(
      z
        .string()
        .min(2, "Perwakilan daerah minimal 2 karakter")
        .max(100, "Perwakilan daerah maksimal 100 karakter")
    ),
  website: z.string().optional(),
});

export const guestRowSchema = z.object({
  nama: z
    .string({ error: "Nama tamu wajib diisi" })
    .min(1, "Nama tamu wajib diisi")
    .transform((val) => normalizeString(val))
    .pipe(
      z
        .string()
        .min(2, "Nama minimal 2 karakter")
        .max(100, "Nama maksimal 100 karakter")
    ),
  perwakilan_daerah: z
    .string({ error: "Perwakilan daerah wajib diisi" })
    .min(1, "Perwakilan daerah wajib diisi")
    .transform((val) => normalizeString(val))
    .pipe(
      z
        .string()
        .min(2, "Perwakilan daerah minimal 2 karakter")
        .max(100, "Perwakilan daerah maksimal 100 karakter")
    ),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type GuestRowInput = z.infer<typeof guestRowSchema>;
