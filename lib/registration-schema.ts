import { z } from "zod";
import { normalizeString } from "./normalize";

export const UKURAN_BAJU = ["S", "M", "L", "XL", "XXL", "3XL"] as const;

export const MODE_KEHADIRAN = ["offline", "online"] as const;

export const MODE_KEHADIRAN_LABEL: Record<(typeof MODE_KEHADIRAN)[number], string> = {
  offline: "Offline (hadir langsung)",
  online: "Online via Zoom",
};

export const REGISTRATION_STATUS = ["pending", "approved", "rejected"] as const;

export const REGISTRATION_STATUS_LABEL: Record<
  (typeof REGISTRATION_STATUS)[number],
  string
> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

// Teks wajib: dinormalisasi (trim + spasi ganda) lalu dibatasi panjangnya.
function requiredText(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} wajib diisi` })
    .min(1, `${label} wajib diisi`)
    .transform((val) => normalizeString(val))
    .pipe(
      z
        .string()
        .min(min, `${label} minimal ${min} karakter`)
        .max(max, `${label} maksimal ${max} karakter`)
    );
}

export const registrationSchema = z.object({
  nama: requiredText("Nama lengkap", 3, 100),
  perwakilan_bmh: requiredText("Perwakilan BMH", 2, 100),
  jabatan: requiredText("Jabatan", 2, 100),
  departemen: z
    .string()
    .optional()
    .transform((val) => (val ? normalizeString(val) : undefined))
    .pipe(
      z
        .string()
        .max(100, "Departemen maksimal 100 karakter")
        .optional()
    ),
  ukuran_baju: z.enum(UKURAN_BAJU, { error: "Pilih ukuran baju" }),
  mode_kehadiran: z.enum(MODE_KEHADIRAN, {
    error: "Pilih keterangan mengikuti acara",
  }),
  // Honeypot: harus kosong. Bot biasanya mengisinya.
  website: z.string().optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
