import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { TransportSection } from "../components/rakernas/transport-accordion";
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

    it("menampilkan 8 titik asal dari TRANSPORT_DATA", () => {
      expect(TRANSPORT_DATA.items).toHaveLength(8);
      TRANSPORT_DATA.items.forEach((item) => {
        expect(item.origin).toBeTruthy();
        expect(item.distance).toBeTruthy();
        expect(item.fares).toHaveLength(3);
      });
      expect(transportContent).toContain("TRANSPORT_DATA.items.map");
      expect(transportContent).toContain("item.distance");
    });

    it("mencakup seluruh 24 tarif moda transportasi sesuai data resmi", () => {
      const allFares = TRANSPORT_DATA.items.flatMap((item) => item.fares);
      expect(allFares).toHaveLength(24);

      const senen = TRANSPORT_DATA.items.find((i) => i.origin === "Stasiun Pasar Senen");
      expect(senen?.distance).toBe("± 3-4 km");
      expect(senen?.fares).toEqual([
        { mode: "Taksi Konvensional", price: "Rp 30.000 - 50.000" },
        { mode: "Taksi Online", price: "Rp 25.000 - 40.000" },
        { mode: "Ojek Online", price: "Rp 12.000 - 20.000" },
      ]);

      const halim = TRANSPORT_DATA.items.find((i) => i.origin === "Bandara Halim Perdanakusuma");
      expect(halim?.icon).toBe("plane");
      expect(halim?.fares[0]).toEqual({ mode: "Taksi Bandara", price: "Rp 90.000 - 140.000" });

      const soetta = TRANSPORT_DATA.items.find((i) => i.origin === "Bandara Soekarno-Hatta");
      expect(soetta?.distance).toBe("± 30 km");
      expect(soetta?.fares[2].price).toBe("Rp 100.000 - 150.000");

      TRANSPORT_DATA.items.forEach((item) => {
        const expectedIcon = item.origin.startsWith("Stasiun") ? "train" : item.origin.startsWith("Terminal") ? "bus" : "plane";
        expect(item.icon, item.origin).toBe(expectedIcon);
      });
    });

    it("menampilkan pengumuman transit: 'panitia' menaut ke footerUrl dan tombol Google Maps terpisah", () => {
      expect(transportContent).toContain("footerUrl");
      expect(transportContent).toContain("href={footerUrl}");
      expect(transportContent).toContain("announcement.mapsUrl");
      expect(transportContent).toContain("announcement.linkLabel");
      expect(transportContent).toContain('role="note"');
      expect(transportContent.match(/rel="noopener noreferrer"/g)?.length).toBe(2);
      // Halaman beranda meneruskan footer_url dari event settings
      expect(pageContent).toContain("footerUrl={settings.footerUrl}");
    });

    it("merender pengumuman dengan tautan footerUrl kustom dan tombol Maps", () => {
      // TransportSection tidak memakai hook sendiri, jadi cukup dipanggil sebagai fungsi.
      const html = renderToStaticMarkup(
        TransportSection({ venueName: "Hotel Uji", footerUrl: "https://example.com/panitia-baru" })
      );
      expect(html).toContain("Hotel Uji");
      expect(html).toContain("Guest House YPPH Depok");
      expect(html).toContain('href="https://example.com/panitia-baru"');
      expect(html).toContain('href="https://maps.app.goo.gl/LrBzn1tPFqKaRFTTA"');
      expect(html).toContain("Stasiun Pasar Senen");
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
      expect(INVITED_GUESTS_CONTENT.title).toBe("Peserta Rakernas");
      expect(INVITED_GUESTS_CONTENT.detailsTitle).toBe("Detail Peserta");
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
        "08-10 Desember 2026 | Hotel Luminor Kota Jakarta Barat @2026"
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
