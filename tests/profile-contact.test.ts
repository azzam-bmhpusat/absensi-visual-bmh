import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  formatArrival,
  isProfileComplete,
  isoToWibLocal,
  normalizeWhatsapp,
  profileContactSchema,
  profileSchema,
  safeNextPath,
  selfProfileSchema,
  whatsappLink,
  wibLocalToIso,
} from "@/lib/profile-contact";

describe("profile-contact", () => {
  it("menormalkan nomor WhatsApp", () => {
    expect(normalizeWhatsapp("0812-3456 7890")).toBe("081234567890");
    expect(normalizeWhatsapp(" +62 812 3456 7890 ")).toBe("+6281234567890");
  });

  it("mengonversi datetime-local WIB <-> ISO", () => {
    expect(wibLocalToIso("2026-11-20T14:00")).toBe("2026-11-20T07:00:00.000Z");
    expect(isoToWibLocal("2026-11-20T07:00:00.000Z")).toBe("2026-11-20T14:00");
    expect(wibLocalToIso("")).toBeNull();
    expect(wibLocalToIso("bukan tanggal")).toBeNull();
  });

  it("memformat hari, tanggal, tahun, jam", () => {
    expect(formatArrival("2026-11-20T07:00:00.000Z")).toBe("Jumat, 20 November 2026, 14.00 WIB");
    expect(formatArrival(null)).toBeNull();
  });

  it("memvalidasi form kontak", () => {
    const ok = profileContactSchema.safeParse({ no_whatsapp: "0812 3456 7890", rencana_kedatangan: "2026-11-20T14:00" });
    expect(ok.success && ok.data).toEqual({ no_whatsapp: "081234567890", rencana_kedatangan: "2026-11-20T07:00:00.000Z" });
    const empty = profileContactSchema.safeParse({ no_whatsapp: "", rencana_kedatangan: "" });
    expect(empty.success && empty.data).toEqual({ no_whatsapp: null, rencana_kedatangan: null });
    expect(profileContactSchema.safeParse({ no_whatsapp: "123", rencana_kedatangan: "" }).success).toBe(false);
    expect(profileContactSchema.safeParse({ no_whatsapp: "", rencana_kedatangan: "xx" }).success).toBe(false);
  });

  const base = () => ({
    email: "user@bmh.or.id",
    nama: "Budi Santoso",
    perwakilan_daerah: "BMH Pusat",
    jabatan: "Ketua",
    ukuran_baju: "XL",
    no_whatsapp: "081234567890",
    rencana_kedatangan: "2026-11-20T14:00",
    keterangan_kehadiran: "offline",
  });

  it("memvalidasi seluruh profil (semua field wajib)", () => {
    const base = {
      email: " User@BMH.or.id ",
      nama: "  Budi   Santoso ",
      perwakilan_daerah: "BMH Pusat",
      jabatan: "Ketua",
      ukuran_baju: "XL",
      no_whatsapp: "0812 3456 7890",
      rencana_kedatangan: "2026-11-20T14:00",
      keterangan_kehadiran: "offline",
    };
    const ok = profileSchema.safeParse(base);
    expect(ok.success && ok.data).toMatchObject({
      email: "user@bmh.or.id",
      nama: "Budi Santoso",
      jabatan: "Ketua",
      ukuran_baju: "XL",
      no_whatsapp: "081234567890",
    });
    for (const key of ["jabatan", "ukuran_baju", "no_whatsapp", "rencana_kedatangan", "keterangan_kehadiran"] as const) {
      expect(profileSchema.safeParse({ ...base, [key]: "" }).success).toBe(false);
    }
    expect(profileSchema.safeParse({ ...base, nama: " " }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, ukuran_baju: "XXXL" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, email: "bukan-email" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, keterangan_kehadiran: "hybrid" }).success).toBe(false);
  });

  it("ukuran baju hanya untuk peserta offline", () => {
    const online = profileSchema.safeParse({ ...base(), keterangan_kehadiran: "online", ukuran_baju: "" });
    expect(online.success && online.data.ukuran_baju).toBeNull();
    const dropped = profileSchema.safeParse({ ...base(), keterangan_kehadiran: "online" });
    expect(dropped.success && dropped.data.ukuran_baju).toBeNull();
    expect(isProfileComplete({ ...base(), keterangan_kehadiran: "online", ukuran_baju: null })).toBe(true);
    expect(isProfileComplete({ ...base(), ukuran_baju: null })).toBe(false);
  });

  it("selfProfileSchema: email & jabatan dikunci (dibuang walau dikirim)", () => {
    const sent = {
      email: "penyusup@contoh.id",
      jabatan: "Ketua Umum",
      nama: "Budi Santoso",
      perwakilan_daerah: "BMH Pusat",
      ukuran_baju: "XL",
      no_whatsapp: "0812 3456 7890",
      rencana_kedatangan: "2026-11-20T14:00",
      keterangan_kehadiran: "offline",
    };
    const parsed = selfProfileSchema.safeParse(sent);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty("email");
    expect(parsed.data).not.toHaveProperty("jabatan");
    expect(parsed.data).toMatchObject({ nama: "Budi Santoso", ukuran_baju: "XL" });
  });

  it("updateProfile tidak membaca email/jabatan dari form dan tidak mengubah email akun", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app", "(site)", "profile", "actions.ts"), "utf-8");
    const fields = src.match(/const FIELDS = \[([\s\S]*?)\]/)?.[1] ?? "";
    expect(fields).not.toMatch(/"email"|"jabatan"/);
    expect(src).toContain("selfProfileSchema");
    expect(src).not.toContain("updateUserById");
  });

  it("isProfileComplete: semua field harus terisi", () => {
    const full = {
      nama: "Budi",
      perwakilan_daerah: "BMH Pusat",
      jabatan: "Ketua",
      ukuran_baju: "XL",
      no_whatsapp: "0812",
      rencana_kedatangan: "2026-11-20T07:00:00.000Z",
      keterangan_kehadiran: "offline",
    };
    expect(isProfileComplete(full)).toBe(true);
    expect(isProfileComplete(null)).toBe(false);
    for (const key of Object.keys(full) as (keyof typeof full)[]) {
      expect(isProfileComplete({ ...full, [key]: null })).toBe(false);
      expect(isProfileComplete({ ...full, [key]: "  " })).toBe(false);
    }
  });

  it("halaman peserta diproteksi middleware dan ProfileGate", () => {
    const mw = fs.readFileSync(path.join(__dirname, "..", "lib", "supabase", "middleware.ts"), "utf-8");
    for (const p of [
      "/informasi-kamar-hotel",
      "/publikasi/foto-galeri-kegiatan",
      "/publikasi/materi-presentasi-rakernas",
      "/publikasi/notula-rapat",
    ]) {
      expect(mw).toContain(`"${p}"`);
    }
  });

  it("whatsappLink membuat link wa.me", () => {
    expect(whatsappLink("081234567890")).toBe("https://wa.me/6281234567890");
    expect(whatsappLink("+6281234567890")).toBe("https://wa.me/6281234567890");
    expect(whatsappLink("")).toBeNull();
  });

  it("hanya menerima ?next= internal", () => {
    expect(safeNextPath("/profile")).toBe("/profile");
    expect(safeNextPath("https://evil.com")).toBe("/profile");
    expect(safeNextPath("//evil.com")).toBe("/profile");
    expect(safeNextPath(null)).toBe("/profile");
  });
});

describe("Migrasi 0012_profiles_contact_arrival.sql", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "0012_profiles_contact_arrival.sql"), "utf-8");
  it("menambah dua kolom tanpa membukanya ke klien", () => {
    expect(sql).toMatch(/add column if not exists no_whatsapp text/);
    expect(sql).toMatch(/add column if not exists rencana_kedatangan timestamptz/);
    expect(sql.replace(/--.*$/gm, "")).not.toMatch(/grant/i);
  });
});

describe("Migrasi 0014_profiles_keterangan_kehadiran.sql", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "0014_profiles_keterangan_kehadiran.sql"), "utf-8");
  it("menambah kolom online/offline tanpa grant", () => {
    expect(sql).toMatch(/add column if not exists keterangan_kehadiran text/);
    expect(sql).toContain("'online', 'offline'");
    expect(sql.replace(/--.*$/gm, "")).not.toMatch(/grant/i);
  });
});
