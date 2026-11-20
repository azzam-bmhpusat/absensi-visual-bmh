import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  TRANSPORT_DATA,
  INVITED_GUESTS_CONTENT,
  FOOTER_DATA,
} from "../content/rakernas";

describe("Fase 5 — Transportasi, Tamu Undangan, Footer", () => {
  const transportFile = path.join(
    __dirname,
    "../components/rakernas/transport-accordion.tsx"
  );
  const invitedGuestsFile = path.join(
    __dirname,
    "../components/rakernas/invited-guests-section.tsx"
  );
  const footerFile = path.join(
    __dirname,
    "../components/rakernas/site-footer.tsx"
  );
  const pageFile = path.join(__dirname, "../app/(site)/page.tsx");

  const transportContent = fs.readFileSync(transportFile, "utf-8");
  const invitedGuestsContent = fs.readFileSync(invitedGuestsFile, "utf-8");
  const footerContent = fs.readFileSync(footerFile, "utf-8");
  const pageContent = fs.readFileSync(pageFile, "utf-8");

  describe("S6 — Info Transportasi (FR-08 & B.6)", () => {
    it("dideklarasikan sebagai Client Component ('use client')", () => {
      expect(transportContent).toMatch(/^"use client"/);
    });

    it("memakai komponen shadcn Accordion, AccordionItem, AccordionTrigger, AccordionContent", () => {
      expect(transportContent).toContain("Accordion");
      expect(transportContent).toContain("AccordionItem");
      expect(transportContent).toContain("AccordionTrigger");
      expect(transportContent).toContain("AccordionContent");
    });

    it("menerapkan konfigurasi single collapsible dengan default item pertama terbuka ('origin-0')", () => {
      expect(transportContent).toMatch(/defaultValue=\{?\["origin-0"\]\}?/);
    });

    it("menerapkan tata letak responsif dua kolom pada layar besar (lg:grid-cols-12)", () => {
      expect(transportContent).toContain("lg:grid-cols-12");
      expect(transportContent).toContain("lg:col-span-5");
      expect(transportContent).toContain("lg:col-span-7");
    });

    it("menampilkan 6 titik asal dari TRANSPORT_DATA", () => {
      expect(TRANSPORT_DATA.items).toHaveLength(6);
      TRANSPORT_DATA.items.forEach((item) => {
        expect(item.origin).toBeTruthy();
        expect(item.fares).toHaveLength(3);
      });
      expect(transportContent).toContain("TRANSPORT_DATA.items.map");
    });

    it("mencakup seluruh 18 tarif moda transportasi yang identik dengan PRD A.5", () => {
      const allFares = TRANSPORT_DATA.items.flatMap((item) => item.fares);
      expect(allFares).toHaveLength(18);

      // Verifikasi beberapa sampel kunci dari A.5
      const bandara = TRANSPORT_DATA.items.find(
        (i) => i.origin === "Bandara Ahmad Yani"
      );
      expect(bandara).toBeDefined();
      expect(bandara?.fares[0]).toEqual({
        mode: "Taksi Bandara",
        price: "Rp. 70.000 - 100.000",
      });
      expect(bandara?.fares[1]).toEqual({
        mode: "Taksi Online",
        price: "Rp. 45.000 - 65.000",
      });
      expect(bandara?.fares[2]).toEqual({
        mode: "Ojek Online",
        price: "Rp. 20.000 - 30.000",
      });

      const tawang = TRANSPORT_DATA.items.find(
        (i) => i.origin === "Stasiun Tawang"
      );
      expect(tawang?.fares[0].price).toBe("Rp. 30.000 - 40.000");

      const mangkang = TRANSPORT_DATA.items.find(
        (i) => i.origin === "Terminal Mangkang"
      );
      expect(mangkang?.fares[0].price).toBe("Rp. 80.000 - 110.000");
    });

    it("menampilkan ikon transportasi di dalam lingkaran hijau lembut (bg-green-100 text-primary)", () => {
      expect(transportContent).toContain("bg-green-100");
      expect(transportContent).toContain("text-primary");
      expect(transportContent).toContain("Plane");
      expect(transportContent).toContain("TrainFront");
      expect(transportContent).toContain("Bus");
    });

    it("memastikan target sentuh trigger minimal 44 px (min-h-[44px])", () => {
      expect(transportContent).toContain("min-h-[44px]");
    });
  });

  describe("S7 — Tamu Undangan", () => {
    it("dideklarasikan sebagai Client Component ('use client')", () => {
      expect(invitedGuestsContent).toMatch(/^"use client"/);
    });

    it("menyediakan pencarian, kartu detail, dan navigasi hasil dengan shadcn", () => {
      for (const component of ["InputGroup", "Label", "Card", "Button", "Badge", "Separator", "Skeleton"]) {
        expect(invitedGuestsContent).toContain(`@/components/ui/${component === "InputGroup" ? "input-group" : component.toLowerCase()}`);
      }
      expect(INVITED_GUESTS_CONTENT.title).toBe("Tamu Undangan");
      expect(INVITED_GUESTS_CONTENT.detailsTitle).toBe("Detail Tamu Undangan");
    });

    it("menghapus rekening, formulir, dan konfirmasi pembayaran dari tampilan", () => {
      expect(invitedGuestsContent).not.toMatch(/REGISTRATION_DATA|navigator.clipboard|forms\.gle|wa\.me/);
      expect(pageContent).not.toContain("RegistrationSection");
      expect(fs.existsSync(path.join(__dirname, "../components/rakernas/registration-section.tsx"))).toBe(false);
    });
  });

  describe("S8 — Footer (B.5 & B.6)", () => {
    it("menampilkan satu logo dari public/logo.png dengan tinggi maksimal 40 px", () => {
      expect(footerContent).toContain("FOOTER_DATA.logoSrc");
      expect(FOOTER_DATA.logoSrc).toBe("/logo.png");
      expect(FOOTER_DATA.logoAlt).toBe("Logo Rakernas BMH 2027");
      expect(footerContent).toContain("h-10");
    });

    it("menampilkan teks resmi tanggal, hotel, dan tahun", () => {
      expect(footerContent).toContain("getEventSummary(settings)");
      expect(FOOTER_DATA.text).toBe(
        "01-03 Desember 2026 | Hotel Luminor Kota Jakarta Barat @2026"
      );
    });

    it("menampilkan tautan resmi ke Panitia Rakernas", () => {
      expect(footerContent).toContain("settings.footerUrl");
      expect(footerContent).toContain("FOOTER_DATA.committee.label");
      expect(FOOTER_DATA.committee.url).toBe("https://wa.me/6289517795206");
      expect(footerContent).toContain('target="_blank"');
      expect(footerContent).toContain('rel="noopener noreferrer"');
    });

    it("tidak memuat penghitung pengunjung (visitor counter)", () => {
      expect(footerContent.toLowerCase()).not.toContain("visitor");
      expect(footerContent.toLowerCase()).not.toContain("pengunjung");
    });
  });

  describe("Integrasi Halaman Utama (app/(site)/page.tsx)", () => {
    it("memasang TransportSection, InvitedGuestsSection, dan SiteFooter", () => {
      expect(pageContent).toContain("TransportSection");
      expect(pageContent).toContain("InvitedGuestsSection");
      expect(pageContent).toContain("SiteFooter");
    });

    it("mengatur id anchor dan latar bagian sesuai Design System", () => {
      expect(pageContent).toContain('id="transportasi"');
      expect(pageContent).toContain("bg-surface");
      expect(pageContent).toContain('id="tamu-undangan"');
      expect(pageContent).toContain("display-theme display-bg");
    });
  });
});
