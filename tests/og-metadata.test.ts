import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { EVENT_INFO, EVENT_THEME } from "../content/rakernas";
import { buildSocialMetadata, OG_DESCRIPTION } from "../lib/og-metadata";

const FORBIDDEN = /luminor|jakarta|hotel|alamat|mangga besar|desember|2026|\b0?1\s*[–-]\s*0?3\b/i;

describe("Open Graph (beranda & registrasi)", () => {
  it("deskripsi OG hanya berisi tema acara", () => {
    expect(EVENT_THEME).toBe(
      "Akselerasi Pertumbuhan dan Penguatan Resiliensi Menuju BMH Unggul 2030"
    );
    expect(OG_DESCRIPTION).toBe(`Tema: ${EVENT_THEME}`);
  });

  it("tema di hero beranda sama dengan tema OG", () => {
    expect(EVENT_INFO.theme).toBe(EVENT_THEME);
  });

  it("beranda: judul acara + tema, kartu twitter besar, URL relatif ke metadataBase", () => {
    const meta = buildSocialMetadata({ path: "/" });
    expect(meta.openGraph).toMatchObject({
      type: "website",
      locale: "id_ID",
      url: "/",
      title: EVENT_INFO.title,
      description: OG_DESCRIPTION,
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: EVENT_INFO.title });
  });

  it("registrasi: judul khusus registrasi dan URL /registrasi", () => {
    const meta = buildSocialMetadata({ title: "Registrasi Peserta Rakernas BMH 2027", path: "/registrasi" });
    expect(meta.openGraph).toMatchObject({
      url: "/registrasi",
      title: "Registrasi Peserta Rakernas BMH 2027",
      description: OG_DESCRIPTION,
    });
  });

  it("metadata OG tidak memuat tanggal maupun lokasi", () => {
    const text = JSON.stringify([
      buildSocialMetadata({ path: "/" }),
      buildSocialMetadata({ title: "Registrasi Peserta Rakernas BMH 2027", path: "/registrasi" }),
    ]);
    expect(text).not.toMatch(FORBIDDEN);
  });

  it("kartu gambar OG hanya memakai judul + tema (tanpa tanggal/lokasi)", () => {
    const source = fs.readFileSync(path.join(__dirname, "../lib/og-card.tsx"), "utf-8");
    expect(source).toContain("EVENT_INFO.title");
    expect(source).toContain("EVENT_THEME");
    // Tidak boleh mengambil data lokasi/tanggal dari konten maupun pengaturan acara
    expect(source).not.toMatch(/hotel|address|mapsUrl|countdownTarget|dateDays|dateMonthYear|venue|startsAt|LOCATION_DATA/);
    expect(source).not.toMatch(FORBIDDEN);
    expect(`${EVENT_INFO.title} Tema: ${EVENT_THEME}`).not.toMatch(FORBIDDEN);
  });
});
