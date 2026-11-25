import { z } from "zod";
import { normalizeString } from "./normalize";
import { MODE_KEHADIRAN, UKURAN_BAJU } from "./participant-options";
import { emailSchema } from "./user-schema";

/** Zona waktu acara: WIB (UTC+7). */
const WIB_OFFSET = "+07:00";

/** Nomor WhatsApp: "0812-3456 7890" / "+62 812..." -> "081234567890" / "+62812...". */
export function normalizeWhatsapp(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/** Nilai `datetime-local` ("2026-11-20T14:00") sebagai waktu WIB -> ISO UTC. null bila kosong/tidak valid. */
export function wibLocalToIso(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const date = new Date(`${v}:00${WIB_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO -> nilai `datetime-local` dalam WIB, untuk mengisi form. */
export function isoToWibLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() + 7 * 3600 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** "Jumat, 20 November 2026, 14.00 WIB". */
export function formatArrival(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");
  return `${day}, ${time} WIB`;
}

export const profileContactSchema = z.object({
  no_whatsapp: z
    .string()
    .transform((v) => (v.trim() ? normalizeWhatsapp(v) : null))
    .pipe(
      z
        .string()
        .regex(/^\+?[0-9]{8,15}$/, "No WhatsApp harus 8–15 digit (contoh: 081234567890)")
        .nullable()
    ),
  rencana_kedatangan: z
    .string()
    .transform((v, ctx) => {
      if (!v.trim()) return null;
      const iso = wibLocalToIso(v);
      if (!iso) {
        ctx.addIssue({ code: "custom", message: "Tanggal dan jam kedatangan tidak valid" });
        return z.NEVER;
      }
      return iso;
    }),
});

export type ProfileContactInput = z.input<typeof profileContactSchema>;

function requiredText(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} wajib diisi` })
    .transform((v) => normalizeString(v))
    .pipe(
      z
        .string()
        .min(1, `${label} wajib diisi`)
        .min(min, `${label} minimal ${min} karakter`)
        .max(max, `${label} maksimal ${max} karakter`)
    );
}

/** Seluruh data profil yang bisa diedit user (email, data peserta, kontak, rencana kedatangan). */
export const profileSchema = profileContactSchema.extend({
  email: emailSchema,
  nama: requiredText("Nama", 2, 100),
  perwakilan_daerah: requiredText("Perwakilan daerah", 2, 100),
  jabatan: requiredText("Jabatan", 2, 100),
  ukuran_baju: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, "Ukuran baju wajib dipilih")
        .pipe(z.enum(UKURAN_BAJU, { error: "Ukuran baju tidak valid" }))
    ),
  no_whatsapp: profileContactSchema.shape.no_whatsapp.pipe(
    z.string({ error: "No WhatsApp wajib diisi" })
  ),
  rencana_kedatangan: profileContactSchema.shape.rencana_kedatangan.pipe(
    z.string({ error: "Rencana kedatangan wajib diisi" })
  ),
  keterangan_kehadiran: z.enum(MODE_KEHADIRAN, { error: "Keterangan kehadiran wajib dipilih" }),
});

/**
 * Data yang boleh diubah peserta sendiri di /profile. Email (akun login) dan jabatan
 * dikunci: hanya admin yang mengubahnya lewat Manajemen User.
 */
export const selfProfileSchema = profileSchema.omit({ email: true, jabatan: true });

/** Profil peserta yang sudah lengkap dikunci di /profile (tampilan dan server). */
export const PROFILE_LOCKED_MESSAGE = "Profil Anda sudah lengkap dan dikunci.";

/** Data yang diisi lewat halaman publik /form: semua field wajib, termasuk jabatan (email, nama, dan perwakilan daerah dikunci; hanya admin yang mengubah). */
export const participantFormSchema = profileSchema.omit({ email: true, nama: true, perwakilan_daerah: true });

/** Teks opsional: kosong -> null; selain itu dinormalkan dan dibatasi panjangnya. */
function optionalText(label: string, min: number, max: number) {
  return z
    .string()
    .transform((v) => normalizeString(v) || null)
    .pipe(
      z
        .string()
        .min(min, `${label} minimal ${min} karakter`)
        .max(max, `${label} maksimal ${max} karakter`)
        .nullable()
    );
}

function optionalEnum<T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z
    .string()
    .transform((v) => v.trim() || null)
    .pipe(z.enum(values, { error: message }).nullable());
}

/**
 * Data profil yang diisi admin dari Manajemen User. Semua field opsional (kosong -> null),
 * karena admin bisa membuat akun sebelum peserta melengkapi datanya lewat /profile.
 */
export const adminProfileSchema = z.object({
  nama: optionalText("Nama", 2, 100),
  perwakilan_daerah: optionalText("Perwakilan daerah", 2, 100),
  jabatan: optionalText("Jabatan", 2, 100),
  kategori: optionalText("Kategori", 1, 100),
  ukuran_baju: optionalEnum(UKURAN_BAJU, "Ukuran baju tidak valid"),
  no_whatsapp: profileContactSchema.shape.no_whatsapp,
  rencana_kedatangan: profileContactSchema.shape.rencana_kedatangan,
  keterangan_kehadiran: optionalEnum(MODE_KEHADIRAN, "Keterangan kehadiran tidak valid"),
});

export const ADMIN_PROFILE_FIELDS = Object.keys(adminProfileSchema.shape) as (keyof typeof adminProfileSchema.shape)[];

export type AdminProfileInput = z.input<typeof adminProfileSchema>;

/** Link chat WhatsApp: 0812... -> https://wa.me/62812... ; null bila nomor kosong. */
export function whatsappLink(no: string | null | undefined): string | null {
  const digits = (no ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export type ProfileInput = z.input<typeof profileSchema>;

/** Kolom profiles yang diperiksa isProfileComplete (untuk .select). */
export const PROFILE_COMPLETE_COLUMNS =
  "nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran";

/** Field peserta yang harus terisi agar profil dianggap lengkap. */
export const PROFILE_COMPLETE_FIELDS = [
  "nama",
  "perwakilan_daerah",
  "jabatan",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
] as const;

type CompletenessInput = Partial<Record<(typeof PROFILE_COMPLETE_FIELDS)[number], string | null>> | null | undefined;

export type ProfileStatus = "complete" | "progress" | "empty";

export const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  complete: "Complete",
  progress: "Progress",
  empty: "Kosong",
};

/** Kelengkapan profil: jumlah field terisi dan statusnya (kosong / sebagian / lengkap). */
export function profileStatus(p: CompletenessInput): { status: ProfileStatus; filled: number; total: number } {
  const total = PROFILE_COMPLETE_FIELDS.length;
  const filled = p
    ? PROFILE_COMPLETE_FIELDS.filter((k) => {
        const v = p[k];
        return typeof v === "string" && v.trim().length > 0;
      }).length
    : 0;
  return { status: filled === total ? "complete" : filled === 0 ? "empty" : "progress", filled, total };
}

/** Profil dianggap lengkap bila seluruh field peserta terisi. */
export function isProfileComplete(p: CompletenessInput): boolean {
  return profileStatus(p).status === "complete";
}

/** Hanya path internal yang boleh dipakai untuk ?next= (cegah open redirect). */
export function safeNextPath(next: string | null | undefined, fallback = "/profile"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

/** Domain email organisasi; satu-satunya domain yang boleh login lewat Google. */
export const BMH_EMAIL_DOMAIN = "bmh.or.id";

/** `true` hanya untuk alamat `...@bmh.or.id` (tanpa membedakan huruf besar/kecil). */
export function isBmhEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(`@${BMH_EMAIL_DOMAIN}`);
}
