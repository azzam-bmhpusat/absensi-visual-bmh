import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  getTimeLeft,
  getDefaultDay,
  parseRundownTitle,
} from "../lib/rakernas-helpers";
import { RUNDOWN_DATA } from "../content/rakernas";

describe("Fase 3 — Hitung Mundur & Rundown (PRD Rakernas BMH)", () => {
  describe("Helper getTimeLeft (FR-04)", () => {
    const target = "2026-12-01T10:00:00+07:00";

    it("menghitung sisa hari, jam, menit, detik dengan benar saat waktu sebelum target", () => {
      // 2 hari, 3 jam, 4 menit, 5 detik sebelum target:
      // Target: 2026-12-01T10:00:00+07:00 (1796094000000 ms)
      const targetTime = new Date(target).getTime();
      const diffMs =
        2 * 86400 * 1000 + 3 * 3600 * 1000 + 4 * 60 * 1000 + 5 * 1000;
      const simulatedNow = new Date(targetTime - diffMs);

      const res = getTimeLeft(target, simulatedNow);

      expect(res.days).toBe(2);
      expect(res.hours).toBe(3);
      expect(res.minutes).toBe(4);
      expect(res.seconds).toBe(5);
      expect(res.formatted).toEqual({
        days: "02",
        hours: "03",
        minutes: "04",
        seconds: "05",
      });
      expect(res.isExpired).toBe(false);
    });

    it("menghasilkan '00' pada semua satuan dan isExpired=true saat tepat di waktu target", () => {
      const now = new Date(target);
      const res = getTimeLeft(target, now);

      expect(res.days).toBe(0);
      expect(res.hours).toBe(0);
      expect(res.minutes).toBe(0);
      expect(res.seconds).toBe(0);
      expect(res.formatted).toEqual({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      expect(res.isExpired).toBe(true);
    });

    it("menghasilkan '00' pada semua satuan dan isExpired=true saat waktu telah lewat", () => {
      const pastNow = new Date(new Date(target).getTime() + 100000);
      const res = getTimeLeft(target, pastNow);

      expect(res.days).toBe(0);
      expect(res.hours).toBe(0);
      expect(res.minutes).toBe(0);
      expect(res.seconds).toBe(0);
      expect(res.formatted).toEqual({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      expect(res.isExpired).toBe(true);
    });

    it("menangani input yang tidak valid secara aman tanpa throw error", () => {
      const res = getTimeLeft("invalid-date", "invalid-now");
      expect(res.isExpired).toBe(true);
      expect(res.formatted.days).toBe("00");
    });
  });

  describe("Helper getDefaultDay (FR-05)", () => {
    it("mengembalikan 'hari1' untuk tanggal sebelum acara (misal 15 November 2026)", () => {
      expect(getDefaultDay("2026-11-15T10:00:00+07:00")).toBe("hari1");
      expect(getDefaultDay("2026-11-30T23:59:59+07:00")).toBe("hari1");
    });

    it("mengembalikan 'hari1' pada Hari 1 (01 Desember 2026 WIB)", () => {
      expect(getDefaultDay("2026-12-01T00:00:01+07:00")).toBe("hari1");
      expect(getDefaultDay("2026-12-01T15:30:00+07:00")).toBe("hari1");
      expect(getDefaultDay("2026-12-01T23:59:59+07:00")).toBe("hari1");
    });

    it("mengembalikan 'hari2' pada Hari 2 (02 Desember 2026 WIB)", () => {
      expect(getDefaultDay("2026-12-02T00:00:01+07:00")).toBe("hari2");
      expect(getDefaultDay("2026-12-02T12:00:00+07:00")).toBe("hari2");
      expect(getDefaultDay("2026-12-02T23:59:59+07:00")).toBe("hari2");
    });

    it("mengembalikan 'hari3' pada Hari 3 (03 Desember 2026 WIB)", () => {
      expect(getDefaultDay("2026-12-03T00:00:01+07:00")).toBe("hari3");
      expect(getDefaultDay("2026-12-03T18:00:00+07:00")).toBe("hari3");
      expect(getDefaultDay("2026-12-03T23:59:59+07:00")).toBe("hari3");
    });

    it("mengembalikan 'hari1' untuk tanggal setelah acara selesai (misal 04 Desember 2026)", () => {
      expect(getDefaultDay("2026-12-04T00:00:00+07:00")).toBe("hari1");
      expect(getDefaultDay("2026-12-10T12:00:00+07:00")).toBe("hari1");
    });

    it("memperhitungkan zona waktu Asia/Jakarta (WIB, UTC+7) dengan benar", () => {
      // 2026-12-01 17:00:00 UTC = 2026-12-02 00:00:00 WIB
      expect(getDefaultDay("2026-12-01T17:00:00Z")).toBe("hari2");
    });
  });

  describe("Helper parseRundownTitle", () => {
    it("memisahkan judul utama dan teks dalam kurung", () => {
      const parsed = parseRundownTitle(
        "Rapat Pleno 1 (Presentasi Program Kerja Bidang Pendidikan)"
      );
      expect(parsed.mainTitle).toBe("Rapat Pleno 1");
      expect(parsed.subtitle).toBe("Presentasi Program Kerja Bidang Pendidikan");
    });

    it("menangani judul tanpa tanda kurung", () => {
      const parsed = parseRundownTitle("Check in");
      expect(parsed.mainTitle).toBe("Check in");
      expect(parsed.subtitle).toBeUndefined();
    });

    it("memanfaatkan explicitNote jika disediakan", () => {
      const parsed = parseRundownTitle("Istirahat (tidur)", "tidur");
      expect(parsed.mainTitle).toBe("Istirahat");
      expect(parsed.subtitle).toBe("tidur");
    });
  });

  describe("Komponen Countdown (S2)", () => {
    const countdownContent = fs.readFileSync(
      path.join(__dirname, "../components/rakernas/countdown.tsx"),
      "utf-8"
    );

    it("adalah Client Component ('use client')", () => {
      expect(countdownContent.startsWith('"use client"')).toBe(true);
    });

    it("menggunakan Skeleton untuk mencegah hydration mismatch sebelum mount", () => {
      expect(countdownContent).toContain("Skeleton");
      expect(countdownContent).toContain("!isMounted");
    });

    it("menggunakan target countdown dari konten tunggal EVENT_INFO", () => {
      expect(countdownContent).toContain("EVENT_INFO.countdownTarget");
    });

    it("memiliki 4 unit kartu: Hari, Jam, Menit, Detik dalam grid-cols-4", () => {
      expect(countdownContent).toContain("grid-cols-4");
      expect(countdownContent).toContain('"Hari"');
      expect(countdownContent).toContain('"Jam"');
      expect(countdownContent).toContain('"Menit"');
      expect(countdownContent).toContain('"Detik"');
    });

    it("memiliki interval 1 detik dan pembersihan saat unmount", () => {
      expect(countdownContent).toContain("setInterval");
      expect(countdownContent).toContain("clearInterval");
      expect(countdownContent).toContain("1000");
    });

    it("menggunakan angka emas text-brand-gold-soft dan tabular-nums", () => {
      expect(countdownContent).toContain("text-brand-gold-soft");
      expect(countdownContent).toContain("tabular-nums");
    });
  });

  describe("Komponen Rundown Tabs (S3)", () => {
    const rundownContent = fs.readFileSync(
      path.join(__dirname, "../components/rakernas/rundown-tabs.tsx"),
      "utf-8"
    );

    it("adalah Client Component ('use client')", () => {
      expect(rundownContent.startsWith('"use client"')).toBe(true);
    });

    it("menggunakan shadcn Tabs, TabsList, TabsTrigger, TabsContent", () => {
      expect(rundownContent).toContain("Tabs");
      expect(rundownContent).toContain("TabsList");
      expect(rundownContent).toContain("TabsTrigger");
      expect(rundownContent).toContain("TabsContent");
    });

    it("memiliki 3 tab: Hari 1, Hari 2, Hari 3 dalam grid-cols-3", () => {
      expect(rundownContent).toContain("grid-cols-3");
      expect(rundownContent).toContain("getEventDays(startsAt)");
      expect(rundownContent).toContain("`Hari ${index + 1}`");
    });

    it("menggunakan Badge variant='secondary' dengan tabular-nums untuk jam", () => {
      expect(rundownContent).toContain("Badge");
      expect(rundownContent).toContain('variant="secondary"');
      expect(rundownContent).toContain("tabular-nums");
    });

    it("mengambil data dari RUNDOWN_DATA dan menggunakan helper pemisah judul", () => {
      expect(rundownContent).toContain("RUNDOWN_DATA");
      expect(rundownContent).toContain("parseRundownTitle");
    });

    it("menampilkan pesan informatif jika rundown hari tersebut masih pending", () => {
      expect(rundownContent).toContain("isPending");
      expect(rundownContent).toContain("Belum dirilis");
    });

    it("memisahkan '(keterangan)' hanya bila ada note eksplisit agar 'Tausiyah (1)' tampil utuh", () => {
      expect(rundownContent).toMatch(/item\.note\s*\?\s*parseRundownTitle\(item\.title, item\.note\)/);
      // Pemecah otomatis akan salah memotong judul bernomor dalam kurung
      expect(parseRundownTitle("H. Tausiyah (1)").mainTitle).toBe("H. Tausiyah");
      expect(RUNDOWN_DATA.hari2[2].note).toBeUndefined();
    });

    it("mendukung judul bagian, waktu rentang, dan sub-poin bernomor", () => {
      expect(rundownContent).not.toContain("item.section");
      expect(rundownContent).toContain("sm:w-28");
      expect(rundownContent).toContain("<ol");
      expect(rundownContent).toContain("item.details");
      expect(rundownContent).toContain("agenda");
    });
  });

  describe("Integrasi Halaman Utama (app/(site)/page.tsx)", () => {
    const pageContent = fs.readFileSync(
      path.join(__dirname, "../app/(site)/page.tsx"),
      "utf-8"
    );

    it("mengimpor dan merender CountdownSection di dalam wadah gelap S1 & S2", () => {
      expect(pageContent).toContain("CountdownSection");
      expect(pageContent).toMatch(
        /display-theme display-bg[\s\S]*?<CountdownSection target={settings.startsAt} endsAt={settings.endsAt} \/>/
      );
    });

    it("mengimpor dan merender RundownSection di bagian S3", () => {
      expect(pageContent).toContain("RundownSection");
      expect(pageContent).toMatch(/<RundownSection startsAt={settings.startsAt} \/>/);
    });
  });

  describe("Audit Design System Fase 3 (PRD B.9)", () => {
    const filesToAudit = [
      path.join(__dirname, "../components/rakernas/countdown.tsx"),
      path.join(__dirname, "../components/rakernas/rundown-tabs.tsx"),
      path.join(__dirname, "../lib/rakernas-helpers.ts"),
    ];

    it("tidak menggunakan warna terlarang Tailwind bawaan (green-*, emerald-*, yellow-*)", () => {
      const forbiddenColorRegex = /\b(green-[2-9]00|emerald-[0-9]+|yellow-[0-9]+)\b/;
      filesToAudit.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content).not.toMatch(forbiddenColorRegex);
      });
    });

    it("tidak memuat raw hex yang melanggar aturan token", () => {
      const rawHexRegex = /#[0-9a-fA-F]{3,6}/g;
      filesToAudit.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const matches = content.match(rawHexRegex) || [];
        expect(matches).toEqual([]);
      });
    });
  });
});
