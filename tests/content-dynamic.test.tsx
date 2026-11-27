import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CardLinkButton } from "@/components/rakernas/card-link-button";
import {
  albumSchema, albumToView, contactSchema, contentImageUrl, formatTanggal, notulaSchema,
  roomSchema, roomToKamar, type AlbumRow, type RoomRow,
} from "@/lib/content/schema";
import { CONTENT_KINDS, rowToFormValues, toSnake } from "@/lib/content/admin-config";

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf-8");
afterEach(() => vi.unstubAllEnvs());

describe("konten dinamis: format & mapper", () => {
  it("format tanggal sama dengan teks dummy lama", () => {
    expect(formatTanggal("2027-02-15")).toBe("Senin, 15 Februari 2027");
    expect(formatTanggal("2027-02-17")).toBe("Rabu, 17 Februari 2027");
  });

  it("penghuni kamar diambil dari profil peserta beserta foto jika tersedia", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    const row: RoomRow = {
      id: 1, nomor: "301", lantai: 3, kapasitas: 2, urutan: 0,
      hotel_room_occupants: [
        { profile_id: "b", profiles: { nama: "Zaid", perwakilan_daerah: "Banten", avatar_url: null } },
        { profile_id: "a", profiles: { nama: "Ahmad", perwakilan_daerah: "Jawa Barat", avatar_url: "a/avatar?v=42" } },
      ],
    };
    expect(roomToKamar(row)).toEqual({
      nomor: "301", lantai: 3,
      penghuni: [
        { id: "a", nama: "Ahmad", wilayah: "Jawa Barat", avatarUrl: "https://test.supabase.co/storage/v1/object/public/avatars/a/avatar?v=42" },
        { id: "b", nama: "Zaid", wilayah: "Banten", avatarUrl: null },
      ],
    });
  });

  it("cover lokal dipakai apa adanya, objek storage jadi URL publik bucket konten", () => {
    expect(contentImageUrl("/galeri-fasilitas-hotel/gedung.jpg", "https://x.supabase.co")).toBe("/galeri-fasilitas-hotel/gedung.jpg");
    expect(contentImageUrl("galeri/a.jpg", "https://x.supabase.co/")).toBe("https://x.supabase.co/storage/v1/object/public/konten/galeri/a.jpg");
    const album: AlbumRow = {
      id: 1, judul: "A", tanggal: "2027-02-16", lokasi: "L", jumlah_foto: 3, cover_path: "/x.jpg",
      deskripsi: "d", drive_url: "https://drive.google.com/", urutan: 0,
    };
    expect(albumToView(album)).toMatchObject({ tanggal: "Selasa, 16 Februari 2027", jumlahFoto: 3, cover: "/x.jpg" });
  });
});

describe("konten dinamis: validasi input admin", () => {
  it("kamar: kapasitas 1–6, nomor wajib", () => {
    expect(roomSchema.safeParse({ nomor: "301", lantai: "3", kapasitas: "2", urutan: "0" }).success).toBe(true);
    expect(roomSchema.safeParse({ nomor: "", lantai: "3", kapasitas: "2" }).success).toBe(false);
    expect(roomSchema.safeParse({ nomor: "301", lantai: "3", kapasitas: "9" }).success).toBe(false);
  });

  it("album: link Drive harus HTTPS dan tanggal valid", () => {
    const base = { judul: "A", tanggal: "2027-02-15", lokasi: "L", jumlahFoto: "1", deskripsi: "", driveUrl: "https://drive.google.com/x" };
    expect(albumSchema.safeParse(base).success).toBe(true);
    expect(albumSchema.safeParse({ ...base, driveUrl: "http://drive.google.com" }).success).toBe(false);
    expect(albumSchema.safeParse({ ...base, tanggal: "15-02-2027" }).success).toBe(false);
  });

  it("link card boleh kosong (jadi null), bila diisi wajib HTTPS", () => {
    const base = { judul: "A", tanggal: "2027-02-15", lokasi: "L", jumlahFoto: "1", deskripsi: "" };
    expect(albumSchema.parse({ ...base, driveUrl: "  " }).driveUrl).toBeNull();
    expect(albumSchema.parse({ ...base, driveUrl: "https://example.com/x" }).driveUrl).toBe("https://example.com/x");
    expect(albumSchema.safeParse({ ...base, driveUrl: "http://example.com" }).success).toBe(false);
  });

  it("tombol card: aktif (link tab baru) bila ada URL, nonaktif bila kosong", () => {
    const on = renderToStaticMarkup(<CardLinkButton href="https://drive.google.com/abc" label="Unduh materi A">Unduh</CardLinkButton>);
    expect(on).toContain('<a href="https://drive.google.com/abc" target="_blank" rel="noopener noreferrer"');
    expect(on).not.toContain('disabled=""');
    const off = renderToStaticMarkup(<CardLinkButton href={null} label="Unduh materi A">Unduh</CardLinkButton>);
    expect(off).toContain("<button");
    expect(off).toContain('disabled=""');
  });

  it("notula: keputusan satu baris satu poin", () => {
    const res = notulaSchema.parse({
      judul: "J", tanggal: "2027-02-15", waktu: "09.00", tempat: "T", pimpinan: "P", notulis: "N",
      jumlahPeserta: "10", keputusan: "Poin 1\n\n  Poin 2  ", status: "Final", driveUrl: "https://drive.google.com/",
    });
    expect(res.keputusan).toEqual(["Poin 1", "Poin 2"]);
  });

  it("kontak: nomor 08… dinormalisasi ke 62…", () => {
    expect(contactSchema.parse({ nama: "Panitia", whatsapp: "0812-3456-7890" }).whatsapp).toBe("6281234567890");
  });

  it("nama field form = camelCase kolom DB", () => {
    expect(toSnake("jumlahPeserta")).toBe("jumlah_peserta");
    expect(rowToFormValues({ drive_url: "u", keputusan: ["a", "b"] })).toEqual({ driveUrl: "u", keputusan: "a\nb" });
    expect(Object.keys(CONTENT_KINDS)).toEqual(["room", "info", "album", "materi", "notula"]);
  });
});

describe("konten dinamis: wiring", () => {
  it("halaman publik tidak lagi memakai data dummy", () => {
    for (const f of ["hotel-info", "galeri-kegiatan", "materi-presentasi", "notula-rapat", "daftar-kamar"]) {
      expect(read("components", "rakernas", `${f}.tsx`)).not.toMatch(/-dummy"/);
    }
    expect(fs.existsSync(path.join(__dirname, "..", "lib", "hotel-dummy.ts"))).toBe(false);
  });

  it("sidebar punya grup Kelola Konten dengan 4 halaman", () => {
    const sidebar = read("components", "admin", "app-sidebar.tsx");
    expect(sidebar).toContain('label: "Kelola Konten"');
    for (const href of ["kamar-hotel", "foto-galeri", "materi-presentasi", "notula-rapat"]) {
      expect(sidebar).toContain(`href: "/kelola-konten/${href}"`);
    }
  });

  it("server action konten mensyaratkan admin dan membersihkan cache", () => {
    const actions = read("app", "(admin)", "kelola-konten", "actions.ts");
    expect(actions.match(/if \(!\(await requireAdmin\(\)\)\) return DENIED;/g)?.length).toBe(4);
    expect(actions).toContain("updateTag(tag)");
    expect(actions).toContain('.neq("role", "user")');
  });

  it("migrasi: penghuni hanya peserta, unik per peserta, tulis hanya admin", () => {
    const sql = read("supabase", "migrations", "0022_content_tables.sql");
    expect(sql).toContain("profile_id uuid not null unique references public.profiles(id)");
    expect(sql).toContain("Penghuni kamar harus ber-role peserta");
    expect(sql).toContain("public.is_admin()");
  });
});
