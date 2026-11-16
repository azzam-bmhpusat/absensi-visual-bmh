import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  TRANSPORT_DATA,
  REGISTRATION_DATA,
  FOOTER_DATA,
} from "../content/rakernas";

describe("Fase 5 — Transportasi, Pendaftaran, Footer (PRD Rakernas BMH)", () => {
  const transportFile = path.join(
    __dirname,
    "../components/rakernas/transport-accordion.tsx"
  );
  const registrationFile = path.join(
    __dirname,
    "../components/rakernas/registration-section.tsx"
  );
  const footerFile = path.join(
    __dirname,
    "../components/rakernas/site-footer.tsx"
  );
  const pageFile = path.join(__dirname, "../app/page.tsx");

  const transportContent = fs.readFileSync(transportFile, "utf-8");
  const registrationContent = fs.readFileSync(registrationFile, "utf-8");
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

  describe("S7 — Cara Mendaftar (FR-09, FR-10 & B.6)", () => {
    it("dideklarasikan sebagai Client Component ('use client')", () => {
      expect(registrationContent).toMatch(/^"use client"/);
    });

    it("menampilkan 4 langkah pendaftaran bernomor urut", () => {
      expect(REGISTRATION_DATA.steps).toHaveLength(4);
      expect(registrationContent).toContain("REGISTRATION_DATA.steps.map");
      expect(registrationContent).toContain("bg-brand-green");
      expect(registrationContent).toContain("text-brand-green-night");
    });

    it("menampilkan kartu rekening resmi BSI dengan border emas dan nomor rekening tabular", () => {
      expect(registrationContent).toContain("REGISTRATION_DATA.bank.label");
      expect(registrationContent).toContain("REGISTRATION_DATA.bank.bankName");
      expect(registrationContent).toContain(
        "REGISTRATION_DATA.bank.accountNumber"
      );
      expect(registrationContent).toContain(
        "REGISTRATION_DATA.bank.accountHolder"
      );
      expect(REGISTRATION_DATA.bank.accountNumber).toBe("9999-8866-17");
      expect(REGISTRATION_DATA.bank.accountHolder).toBe(
        "an. DPW Hidayatullah Jateng"
      );
      expect(registrationContent).toContain("border-brand-gold");
      expect(registrationContent).toContain("text-brand-gold-soft");
    });

    it("menyediakan tombol salin rekening dengan Tooltip dan Sonner toast", () => {
      expect(registrationContent).toContain("navigator.clipboard.writeText");
      expect(registrationContent).toContain("toast.success");
      expect(registrationContent).toContain("Nomor rekening tersalin");
      expect(registrationContent).toContain("Tooltip");
      expect(registrationContent).toContain("TooltipTrigger");
      expect(registrationContent).toContain("TooltipContent");
      expect(registrationContent).toContain("Salin nomor");
      expect(registrationContent).toContain("Check");
      expect(registrationContent).toContain("Copy");
    });

    it("menyediakan dua tombol aksi pendaftaran dengan tinggi minimal 48 px dan membuka tab baru", () => {
      expect(registrationContent).toContain("REGISTRATION_DATA.actions.form.url");
      expect(registrationContent).toContain(
        "REGISTRATION_DATA.actions.confirm.url"
      );
      expect(REGISTRATION_DATA.actions.form.url).toBe(
        "https://forms.gle/8E5oksPuZpKvvjQR6"
      );
      expect(REGISTRATION_DATA.actions.confirm.url).toContain(
        "https://wa.me/6283842037788"
      );
      expect(registrationContent).toContain('target="_blank"');
      expect(registrationContent).toContain('rel="noopener noreferrer"');
      expect(registrationContent).toContain("h-12");
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
      expect(footerContent).toContain("FOOTER_DATA.text");
      expect(FOOTER_DATA.text).toBe(
        "01-03 Desember 2026 | Hotel Luminor Kota Jakarta Barat @2026"
      );
    });

    it("menampilkan tautan resmi ke Panitia Rakernas", () => {
      expect(footerContent).toContain("FOOTER_DATA.committee.url");
      expect(footerContent).toContain("FOOTER_DATA.committee.label");
      expect(FOOTER_DATA.committee.url).toBe("https://hidayatullahjateng.or.id/");
      expect(footerContent).toContain('target="_blank"');
      expect(footerContent).toContain('rel="noopener noreferrer"');
    });

    it("tidak memuat penghitung pengunjung (visitor counter)", () => {
      expect(footerContent.toLowerCase()).not.toContain("visitor");
      expect(footerContent.toLowerCase()).not.toContain("pengunjung");
    });
  });

  describe("Integrasi Halaman Utama (app/page.tsx)", () => {
    it("memasang TransportSection, RegistrationSection, dan SiteFooter", () => {
      expect(pageContent).toContain("TransportSection");
      expect(pageContent).toContain("RegistrationSection");
      expect(pageContent).toContain("SiteFooter");
    });

    it("mengatur id anchor dan latar bagian sesuai Design System", () => {
      expect(pageContent).toContain('id="transportasi"');
      expect(pageContent).toContain("bg-surface");
      expect(pageContent).toContain('id="pendaftaran"');
      expect(pageContent).toContain("display-theme display-bg");
    });
  });
});
