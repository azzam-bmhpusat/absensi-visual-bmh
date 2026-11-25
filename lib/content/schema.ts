import { z } from "zod";

/** Konten dinamis (migrasi 0022): tipe tampilan, skema input admin, dan mapper baris DB. */

export const CONTENT_TAGS = {
  hotel: "content-hotel",
  galeri: "content-galeri",
  materi: "content-materi",
  notula: "content-notula",
} as const;

export const CONTENT_BUCKET = "konten";
export const CONTENT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const CONTENT_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

// ---- Tipe tampilan (dipakai komponen halaman publik) ----
export type Penghuni = { nama: string; wilayah: string };
export type Kamar = { nomor: string; lantai: number; penghuni: Penghuni[] };
export type InfoPenting = { judul: string; isi: string };
export type KontakPanitia = { nama: string; whatsapp: string };
export type AlbumKegiatan = {
  judul: string; tanggal: string; lokasi: string; jumlahFoto: number;
  cover: string; deskripsi: string; driveUrl: string;
};
export type MateriPresentasi = {
  judul: string; pemateri: string; jabatan: string; sesi: string; tanggal: string;
  format: "PDF" | "PPTX"; ukuran: string; deskripsi: string; driveUrl: string;
};
export type NotulaRapat = {
  judul: string; tanggal: string; waktu: string; tempat: string; pimpinan: string; notulis: string;
  jumlahPeserta: number; keputusan: string[]; status: "Final" | "Draf"; driveUrl: string;
};

// ---- Baris DB ----
export type RoomRow = {
  id: number; nomor: string; lantai: number; kapasitas: number; urutan: number;
  hotel_room_occupants: { profile_id: string; profiles: { nama: string | null; perwakilan_daerah: string | null } | null }[];
};
export type InfoRow = { id: number; judul: string; isi: string; urutan: number };
export type AlbumRow = {
  id: number; judul: string; tanggal: string; lokasi: string; jumlah_foto: number; cover_path: string;
  deskripsi: string; drive_url: string; urutan: number;
};
export type MateriRow = {
  id: number; judul: string; pemateri: string; jabatan: string; sesi: string; tanggal: string;
  format: "PDF" | "PPTX"; ukuran: string; deskripsi: string; drive_url: string; urutan: number;
};
export type NotulaRow = {
  id: number; judul: string; tanggal: string; waktu: string; tempat: string; pimpinan: string; notulis: string;
  jumlah_peserta: number; keputusan: string[]; status: "Final" | "Draf"; drive_url: string; urutan: number;
};

/** '2027-02-15' -> 'Senin, 15 Februari 2027' (sama dengan teks dummy sebelumnya). */
export function formatTanggal(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(d);
}

/** cover_path: path lokal '/…' dipakai apa adanya, selain itu objek di bucket 'konten'. */
export function contentImageUrl(path: string, base = process.env.NEXT_PUBLIC_SUPABASE_URL): string {
  if (path.startsWith("/") || /^https?:\/\//i.test(path) || !base) return path;
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${CONTENT_BUCKET}/${path}`;
}

export function contentImageError(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Pilih gambar terlebih dahulu.";
  if (!(CONTENT_IMAGE_MIME as readonly string[]).includes(file.type)) return "Format gambar harus JPG, PNG, atau WebP.";
  if (file.size > CONTENT_IMAGE_MAX_BYTES) return "Ukuran gambar maksimal 2 MB.";
  return null;
}

export const roomToKamar = (r: RoomRow): Kamar => ({
  nomor: r.nomor,
  lantai: r.lantai,
  penghuni: r.hotel_room_occupants
    .map((o) => ({ nama: o.profiles?.nama?.trim() || "Peserta", wilayah: o.profiles?.perwakilan_daerah?.trim() || "-" }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id")),
});
export const albumToView = (r: AlbumRow): AlbumKegiatan => ({
  judul: r.judul, tanggal: formatTanggal(r.tanggal), lokasi: r.lokasi, jumlahFoto: r.jumlah_foto,
  cover: contentImageUrl(r.cover_path), deskripsi: r.deskripsi, driveUrl: r.drive_url,
});
export const materiToView = (r: MateriRow): MateriPresentasi => ({
  judul: r.judul, pemateri: r.pemateri, jabatan: r.jabatan, sesi: r.sesi, tanggal: formatTanggal(r.tanggal),
  format: r.format, ukuran: r.ukuran, deskripsi: r.deskripsi, driveUrl: r.drive_url,
});
export const notulaToView = (r: NotulaRow): NotulaRapat => ({
  judul: r.judul, tanggal: formatTanggal(r.tanggal), waktu: r.waktu, tempat: r.tempat, pimpinan: r.pimpinan,
  notulis: r.notulis, jumlahPeserta: r.jumlah_peserta, keputusan: r.keputusan ?? [], status: r.status, driveUrl: r.drive_url,
});

// ---- Skema input admin ----
const text = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`);
const optText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter.`);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid.");
const int = (label: string, min: number, max: number) => z.coerce.number({ error: `${label} harus angka.` })
  .int(`${label} harus bilangan bulat.`).min(min, `${label} minimal ${min}.`).max(max, `${label} maksimal ${max}.`);
const httpsUrl = z.string().trim().max(2048).refine((v) => {
  try { const u = new URL(v); return u.protocol === "https:" && Boolean(u.hostname); } catch { return false; }
}, "Gunakan URL HTTPS yang valid.");
const urutan = int("Urutan", 0, 100000).default(0);

export const idSchema = z.coerce.number().int().positive();

export const roomSchema = z.object({
  nomor: text("Nomor kamar", 20),
  lantai: int("Lantai", 0, 200),
  kapasitas: int("Kapasitas", 1, 6),
  urutan,
});
export const occupantsSchema = z.object({
  roomId: idSchema,
  profileIds: z.array(z.uuid()).max(6),
});
export const infoSchema = z.object({ judul: text("Judul"), isi: text("Isi", 2000), urutan });
export const contactSchema = z.object({
  nama: text("Nama kontak", 100),
  whatsapp: z.string().trim().transform((v) => v.replace(/\D/g, "").replace(/^0/, "62"))
    .pipe(z.string().regex(/^\d{8,16}$/, "Nomor WhatsApp tidak valid.")),
});
export const albumSchema = z.object({
  judul: text("Judul"), tanggal: isoDate, lokasi: text("Lokasi"), jumlahFoto: int("Jumlah foto", 0, 100000),
  deskripsi: optText(2000), driveUrl: httpsUrl, urutan,
});
export const materiSchema = z.object({
  judul: text("Judul"), pemateri: text("Pemateri"), jabatan: optText(200), sesi: text("Sesi", 100), tanggal: isoDate,
  format: z.enum(["PDF", "PPTX"], { error: "Pilih format." }), ukuran: optText(20), deskripsi: optText(2000),
  driveUrl: httpsUrl, urutan,
});
export const notulaSchema = z.object({
  judul: text("Judul"), tanggal: isoDate, waktu: text("Waktu", 50), tempat: text("Tempat"), pimpinan: text("Pimpinan"),
  notulis: text("Notulis"), jumlahPeserta: int("Jumlah peserta", 0, 100000),
  keputusan: z.string().transform((v) => v.split("\n").map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(500, "Satu poin keputusan maksimal 500 karakter.")).max(50)),
  status: z.enum(["Final", "Draf"], { error: "Pilih status." }), driveUrl: httpsUrl, urutan,
});

export type FieldErrors = Record<string, string>;
export type ContentResult = { success: true } | { success: false; error: string; fieldErrors?: FieldErrors };

export function fieldErrorsOf(issues: readonly { path: PropertyKey[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {};
  for (const i of issues) { const k = String(i.path[0] ?? "form"); out[k] ??= i.message; }
  return out;
}
