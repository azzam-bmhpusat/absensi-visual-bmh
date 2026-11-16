import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroSection } from "../components/rakernas/hero";
import { generateMetadata } from "../app/page";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
vi.mock("@/lib/event-settings-server", () => ({ getEventSettings: async () => DEFAULT_EVENT_SETTINGS }));
import { SITE_METADATA, NAV_ITEMS, EVENT_INFO } from "../content/rakernas";

describe("Fase 2 — Kerangka, Header, Hero (PRD Rakernas BMH)", () => {
  describe("Metadata Halaman (FR-13)", () => {
    it("menetapkan title mutlak 'Rakernas BMH' tanpa kata 'Hidayatullah'", async () => {
      const metadata = await generateMetadata();
      expect(metadata.title).toEqual({ absolute: SITE_METADATA.title });
      expect(SITE_METADATA.title).toBe("Rakernas BMH");
    });

    it("menetapkan description sesuai dengan tanggal dan lokasi acara", async () => {
      const metadata = await generateMetadata();
      expect(metadata.description).toContain("01–03 Desember 2026");
      expect(metadata.description).toContain("Hotel Luminor");
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
      // S1 Hero berdiri sendiri; tema gelap dibatasi pada S2 Countdown.
      expect(pageContent).toMatch(/<HeroSection\s+settings={settings}\s*\/>\s*\{\/\*[^}]*\*\/\}\s*<section\s+id="countdown"/);
      expect(pageContent).toMatch(/id="countdown"[^>]*display-theme display-bg/);
      // S3 Rundown
      expect(pageContent).toContain("page-bg");
      // S4 Dress Code
      expect(pageContent).toContain("bg-secondary");
      // S5 Lokasi
      expect(pageContent).toContain("bg-background");
      // S6 Transportasi
      expect(pageContent).toContain("bg-surface");
      // S7 Tamu Undangan
      expect(pageContent).toMatch(/id="tamu-undangan"[^>]*display-theme display-bg/);
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

    const heroMarkup = renderToStaticMarkup(createElement(HeroSection));

    it("menampilkan judul H1, tema, tanggal, dan lokasi dari data acara terkini", () => {
      const title = heroMarkup.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
      expect(title?.replace(/<[^>]*>/g, "")).toBe(EVENT_INFO.title);
      expect(heroMarkup).toContain(EVENT_INFO.theme);
      expect(heroMarkup).toContain(EVENT_INFO.dateDays.replace(/\s*-\s*/, "–"));
      expect(heroMarkup).toContain(EVENT_INFO.dateMonthYear);
      expect(heroMarkup).toContain(EVENT_INFO.hotel);
      expect(heroMarkup).not.toContain("Semarang");
    });

    it("tidak memuat logo atau gambar pada hero", () => {
      expect(heroMarkup).not.toContain("<img");
      expect(heroMarkup).not.toContain(EVENT_INFO.logoSrc);
    });

    it("memiliki tombol lokasi ke Maps terkini dengan keamanan tautan eksternal", () => {
      expect(heroMarkup).toContain(`href="${EVENT_INFO.mapsUrl}"`);
      expect(heroMarkup).toContain("Lihat lokasi acara");
      expect(heroMarkup).toContain('target="_blank"');
      expect(heroMarkup).toContain('rel="noopener noreferrer"');
      expect(heroContent).toContain("styles.button");
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
