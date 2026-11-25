/** Konfigurasi form CRUD "Kelola Konten" (client-safe). Nama field = camelCase dari kolom DB. */

export type ContentKind = "room" | "info" | "album" | "materi" | "notula";

export type FieldType = "text" | "textarea" | "number" | "date" | "url" | "lines" | "select" | "image";
export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  hint?: string;
};

export type KindConfig = {
  title: string;
  singular: string;
  /** Kolom ringkas di tabel admin. */
  columns: { name: string; label: string }[];
  fields: FieldConfig[];
};

const urutan: FieldConfig = { name: "urutan", label: "Urutan tampil", type: "number", hint: "Angka kecil tampil lebih dulu." };

export const CONTENT_KINDS: Record<ContentKind, KindConfig> = {
  room: {
    title: "Kamar",
    singular: "kamar",
    columns: [{ name: "nomor", label: "Nomor" }, { name: "lantai", label: "Lantai" }, { name: "kapasitas", label: "Kapasitas" }],
    fields: [
      { name: "nomor", label: "Nomor kamar", type: "text", required: true, placeholder: "301" },
      { name: "lantai", label: "Lantai", type: "number", required: true },
      { name: "kapasitas", label: "Kapasitas penghuni", type: "number", required: true },
      urutan,
    ],
  },
  info: {
    title: "Info & Ketentuan",
    singular: "info",
    columns: [{ name: "judul", label: "Judul" }, { name: "isi", label: "Isi" }],
    fields: [
      { name: "judul", label: "Judul", type: "text", required: true },
      { name: "isi", label: "Isi", type: "textarea", required: true },
      urutan,
    ],
  },
  album: {
    title: "Album Foto",
    singular: "album",
    columns: [{ name: "judul", label: "Judul" }, { name: "tanggal", label: "Tanggal" }, { name: "lokasi", label: "Lokasi" }, { name: "jumlahFoto", label: "Foto" }],
    fields: [
      { name: "judul", label: "Judul album", type: "text", required: true },
      { name: "tanggal", label: "Tanggal", type: "date", required: true },
      { name: "lokasi", label: "Lokasi", type: "text", required: true },
      { name: "jumlahFoto", label: "Jumlah foto", type: "number", required: true },
      { name: "cover", label: "Foto sampul", type: "image", hint: "JPG/PNG/WebP, maksimal 2 MB. Kosongkan saat edit untuk memakai sampul lama." },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "driveUrl", label: "Link Google Drive", type: "url", required: true, placeholder: "https://drive.google.com/…" },
      urutan,
    ],
  },
  materi: {
    title: "Materi Presentasi",
    singular: "materi",
    columns: [{ name: "judul", label: "Judul" }, { name: "pemateri", label: "Pemateri" }, { name: "sesi", label: "Sesi" }, { name: "tanggal", label: "Tanggal" }],
    fields: [
      { name: "judul", label: "Judul materi", type: "text", required: true },
      { name: "pemateri", label: "Pemateri", type: "text", required: true },
      { name: "jabatan", label: "Jabatan / instansi", type: "text" },
      { name: "sesi", label: "Sesi", type: "text", required: true },
      { name: "tanggal", label: "Tanggal", type: "date", required: true },
      { name: "format", label: "Format", type: "select", options: ["PDF", "PPTX"], required: true },
      { name: "ukuran", label: "Ukuran file", type: "text", placeholder: "3,2 MB" },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
      { name: "driveUrl", label: "Link Google Drive", type: "url", required: true, placeholder: "https://drive.google.com/…" },
      urutan,
    ],
  },
  notula: {
    title: "Notula Rapat",
    singular: "notula",
    columns: [{ name: "judul", label: "Judul" }, { name: "tanggal", label: "Tanggal" }, { name: "tempat", label: "Tempat" }, { name: "status", label: "Status" }],
    fields: [
      { name: "judul", label: "Judul rapat", type: "text", required: true },
      { name: "tanggal", label: "Tanggal", type: "date", required: true },
      { name: "waktu", label: "Waktu", type: "text", required: true, placeholder: "09.00–12.00 WIB" },
      { name: "tempat", label: "Tempat", type: "text", required: true },
      { name: "pimpinan", label: "Pimpinan rapat", type: "text", required: true },
      { name: "notulis", label: "Notulis", type: "text", required: true },
      { name: "jumlahPeserta", label: "Jumlah peserta", type: "number", required: true },
      { name: "keputusan", label: "Keputusan", type: "lines", hint: "Satu baris satu poin keputusan." },
      { name: "status", label: "Status", type: "select", options: ["Final", "Draf"], required: true },
      { name: "driveUrl", label: "Link Google Drive", type: "url", required: true, placeholder: "https://drive.google.com/…" },
      urutan,
    ],
  },
};

export const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Baris DB (snake_case) -> nilai form (camelCase, string). */
export function rowToFormValues(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = Array.isArray(v) ? v.join("\n") : v == null ? "" : String(v);
  }
  return out;
}
