import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { metadata } from "../app/page";
import { SITE_METADATA, NAV_ITEMS } from "../content/rakernas";

describe("Fase 2 — Kerangka, Header, Hero (PRD Rakernas BMH)", () => {
  describe("Metadata Halaman (FR-13)", () => {
    it("menetapkan title mutlak 'Rakernas BMH' tanpa kata 'Hidayatullah'", () => {
      expect(metadata.title).toEqual({ absolute: SITE_METADATA.title });
      expect(SITE_METADATA.title).toBe("Rakernas BMH");
    });

    it("menetapkan description sesuai dengan tanggal dan lokasi acara", () => {
      expect(metadata.description).toBe(SITE_METADATA.description);
      expect(metadata.description).toContain("01–03 Desember 2026");
      expect(metadata.description).toContain("Hotel Grasia Semarang");
    });
  });

  describe("Struktur Kerangka Halaman S0–S8 (A.4 & B.5)", () => {
    const pageContent = fs.readFileSync(path.join(__dirname, "../app/page.tsx"), "utf-8");

    it("memuat seluruh section anchor yang ada di NAV_ITEMS dengan scroll-mt-20", () => {
      NAV_ITEMS.forEach((item) => {
        const anchorId = item.href.replace("#", "");
        expect(pageContent).toContain(`id="${anchorId}"`);
        expect(pageContent).toMatch(new RegExp(`id="${anchorId}"[^>]*scroll-mt-20`));
      });
    });

    it("menerapkan ritme latar per bagian sesuai PRD B.5", () => {
      // S1 Hero + S2 Countdown dalam satu wadah gelap bersama
      expect(pageContent).toContain("display-theme display-bg");
      // S3 Rundown
      expect(pageContent).toContain("page-bg");
      // S4 Dress Code
      expect(pageContent).toContain("bg-secondary");
      // S5 Lokasi
      expect(pageContent).toContain("bg-background");
      // S6 Transportasi
      expect(pageContent).toContain("bg-surface");
      // S7 Pendaftaran
      expect(pageContent).toMatch(/id="pendaftaran"[^>]*display-theme display-bg/);
      // S8 Footer
      expect(pageContent).toContain("bg-brand-green-night");
    });
  });

  describe("Site Header (S0)", () => {
    const headerContent = fs.readFileSync(
      path.join(__dirname, "../components/rakernas/site-header.tsx"),
      "utf-8"
    );

    it("tidak memuat tombol LOGIN (A.5 S0 & A.9)", () => {
      expect(headerContent.toLowerCase()).not.toContain("login");
      expect(headerContent.toLowerCase()).not.toContain("masuk");
    });

    it("menggunakan logo public/logo.png dengan link ke /", () => {
      expect(headerContent).toContain("EVENT_INFO.logoSrc");
      expect(headerContent).toContain('href="/"');
    });

    it("memiliki DropdownMenu shadcn dengan trigger berukuran sentuh >= 44px (size-11)", () => {
      expect(headerContent).toContain("DropdownMenu");
      expect(headerContent).toContain("DropdownMenuTrigger");
      expect(headerContent).toContain("DropdownMenuContent");
      expect(headerContent).toContain("size-11"); // 44px
    });

    it("memiliki seluruh item menu dari NAV_ITEMS dengan tinggi minimal 44px", () => {
      expect(headerContent).toContain("min-h-[44px]");
      expect(headerContent).toContain("NAV_ITEMS.map");
    });
  });

  describe("Hero Section (S1)", () => {
    const heroContent = fs.readFileSync(
      path.join(__dirname, "../components/rakernas/hero.tsx"),
      "utf-8"
    );

    it("menampilkan judul H1, tema H2, tanggal besar, dan tombol lokasi dari EVENT_INFO", () => {
      expect(heroContent).toContain("EVENT_INFO.title");
      expect(heroContent).toContain("EVENT_INFO.theme");
      expect(heroContent).toContain("EVENT_INFO.dateDays");
      expect(heroContent).toContain("EVENT_INFO.dateMonthYear");
      expect(heroContent).toContain("EVENT_INFO.hotel");
      expect(heroContent).toContain("EVENT_INFO.mapsUrl");
    });

    it("membungkus logo hero dalam kontainer putih berkontras tinggi (PRD B.6)", () => {
      expect(heroContent).toContain("rounded-2xl bg-white");
    });

    it("memiliki tombol lokasi dengan varian aksen emas dan keamanan tautan eksternal", () => {
      expect(heroContent).toContain("bg-brand-gold-soft");
      expect(heroContent).toContain('target="_blank"');
      expect(heroContent).toContain('rel="noopener noreferrer"');
    });

    it("memiliki layout mobile-first dan dua kolom pada breakpoint lg", () => {
      expect(heroContent).toContain("order-1 lg:order-2");
      expect(heroContent).toContain("order-2 lg:order-1");
      expect(heroContent).toContain("grid-cols-1 lg:grid-cols-12");
    });
  });

  describe("Audit Design System (PRD B.9)", () => {
    const filesToAudit = [
      path.join(__dirname, "../app/page.tsx"),
      path.join(__dirname, "../components/rakernas/site-header.tsx"),
      path.join(__dirname, "../components/rakernas/hero.tsx"),
    ];

    it("tidak menggunakan warna bawaan Tailwind terlarang (green-*, emerald-*, yellow-*)", () => {
      const forbiddenColorRegex = /\b(green-[2-9]00|emerald-[0-9]+|yellow-[0-9]+)\b/;
      filesToAudit.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        expect(content).not.toMatch(forbiddenColorRegex);
      });
    });

    it("tidak ada hex raw selain yang ada di shadow atau token yang sah", () => {
      // Hanya izinkan hex yang diizinkan PRD seperti shadow-[...] rgba atau sejenisnya
      const rawHexRegex = /#[0-9a-fA-F]{3,6}/g;
      filesToAudit.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const matches = content.match(rawHexRegex) || [];
        // Pastikan tidak ada raw hex sembarangan di komponen
        expect(matches).toEqual([]);
      });
    });
  });
});
