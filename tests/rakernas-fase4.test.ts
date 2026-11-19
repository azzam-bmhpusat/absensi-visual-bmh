import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DRESSCODE_DATA, LOCATION_DATA, EVENT_INFO } from "../content/rakernas";

describe("Fase 4 — Dress Code & Lokasi (PRD Rakernas BMH)", () => {
  const dresscodeFile = path.join(
    __dirname,
    "../components/rakernas/dresscode-carousel.tsx"
  );
  const locationFile = path.join(
    __dirname,
    "../components/rakernas/location-section.tsx"
  );
  const pageFile = path.join(__dirname, "../app/page.tsx");

  const dresscodeContent = fs.readFileSync(dresscodeFile, "utf-8");
  const locationContent = fs.readFileSync(locationFile, "utf-8");
  const pageContent = fs.readFileSync(pageFile, "utf-8");

  describe("S4 — Dress Code Carousel (FR-06 & B.6)", () => {
    it("dideklarasikan sebagai Client Component ('use client')", () => {
      expect(dresscodeContent).toMatch(/^"use client"/);
    });

    it("memakai komponen shadcn Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext", () => {
      expect(dresscodeContent).toContain("Carousel");
      expect(dresscodeContent).toContain("CarouselContent");
      expect(dresscodeContent).toContain("CarouselItem");
      expect(dresscodeContent).toContain("CarouselPrevious");
      expect(dresscodeContent).toContain("CarouselNext");
    });

    it("menerapkan konfigurasi align: 'start' pada Carousel", () => {
      expect(dresscodeContent).toContain('align: "start"');
    });

    it("menerapkan responsive item basis mobile first: basis-4/5, sm:basis-1/2, lg:basis-1/3, xl:basis-1/4", () => {
      expect(dresscodeContent).toContain("basis-4/5");
      expect(dresscodeContent).toContain("sm:basis-1/2");
      expect(dresscodeContent).toContain("lg:basis-1/3");
      expect(dresscodeContent).toContain("xl:basis-1/4");
    });

    it("merender 5 item dress code dari DRESSCODE_DATA", () => {
      expect(DRESSCODE_DATA).toHaveLength(5);
      expect(dresscodeContent).toContain("DRESSCODE_DATA.map");
      DRESSCODE_DATA.forEach((item) => {
        expect(item.src).toMatch(/^\/rakernas\/dresscode-\d\.webp$/);
        expect(item.alt).toMatch(/^Dress Code \d$/);
      });
    });

    it("menyembunyikan tombol panah navigasi di mobile dan menampilkannya mulai md (hidden md:inline-flex)", () => {
      expect(dresscodeContent).toMatch(/CarouselPrevious[^>]*hidden md:inline-flex/);
      expect(dresscodeContent).toMatch(/CarouselNext[^>]*hidden md:inline-flex/);
    });

    it("menyediakan titik indikator pagination dengan target sentuh minimal 44 px (min-h-11 min-w-11)", () => {
      expect(dresscodeContent).toContain("min-h-11 min-w-11");
      expect(dresscodeContent).toContain('role="tablist"');
      expect(dresscodeContent).toContain('role="tab"');
      expect(dresscodeContent).toContain("api?.scrollTo");
      expect(dresscodeContent).toContain("selectedScrollSnap");
    });

    it("mengatur image sizes responsif pada gambar dress code", () => {
      expect(dresscodeContent).toContain("sizes=");
      expect(dresscodeContent).toContain("80vw");
      expect(dresscodeContent).toContain("50vw");
      expect(dresscodeContent).toContain("33vw");
      expect(dresscodeContent).toContain("25vw");
    });
  });

  describe("S5 — Lokasi Rakernas (FR-07, B.5 & B.6)", () => {
    it("dideklarasikan sebagai Client Component ('use client')", () => {
      expect(locationContent).toMatch(/^"use client"/);
    });

    it("mengganti banner placeholder dengan peta pada koordinat hotel resmi", () => {
      expect(locationContent).toContain("<LocationMap location={settings} />");
      expect(locationContent).not.toContain("LOCATION_DATA.banner.src");
      expect(LOCATION_DATA.map.coordinates).toEqual([106.823191, -6.148531]);
      expect(LOCATION_DATA.map.zoom).toBe(7);
      expect(LOCATION_DATA.map.styleUrl).toBe("https://tiles.openfreemap.org/styles/positron");
    });

    it("menampilkan nama hotel dan alamat lengkap dari LOCATION_DATA", () => {
      expect(locationContent).toContain("settings.venueName");
      expect(locationContent).toContain("settings.venueAddress");
      expect(LOCATION_DATA.hotel).toBe(EVENT_INFO.hotel);
      expect(LOCATION_DATA.address).toBe(EVENT_INFO.address);
    });

    it("memiliki tombol aksi Google Map dengan tautan eksternal yang benar dan tab baru", () => {
      expect(locationContent).toContain("settings.mapsUrl");
      expect(locationContent).toContain("Google Maps {settings.venueName}");
      expect(locationContent).toContain('target="_blank"');
      expect(locationContent).toContain('rel="noopener noreferrer"');
      expect(LOCATION_DATA.mapsUrl).toBe("https://maps.app.goo.gl/d4RQdTwK9jbx4qZD8");
      expect(LOCATION_DATA.mapsButtonLabel).toBe("Google Map Hotel Luminor");
    });

    it("menampilkan 8 foto galeri dari LOCATION_DATA dengan urutan keterangan persis sesuai PRD A.5", () => {
      expect(LOCATION_DATA.gallery).toHaveLength(8);
      const expectedCaptions = [
        "Gedung Utama",
        "Ruang Acara",
        "Masjid",
        "Restaurant",
        "Kamar",
        "Kamar",
        "Kolam Renang",
        "Area Parkir",
      ];
      expect(LOCATION_DATA.gallery.map((g) => g.caption)).toEqual(expectedCaptions);
      expect(locationContent).toContain("LOCATION_DATA.gallery.map");
    });

    it("menerapkan galeri Carousel dengan basis-[85%] sm:basis-1/2 lg:basis-1/3", () => {
      expect(locationContent).toContain("basis-[85%]");
      expect(locationContent).toContain("sm:basis-1/2");
      expect(locationContent).toContain("lg:basis-1/3");
    });

    it("memiliki modal Dialog pembesaran foto dengan DialogTitle dan DialogDescription", () => {
      expect(locationContent).toContain("Dialog");
      expect(locationContent).toContain("DialogContent");
      expect(locationContent).toContain("DialogHeader");
      expect(locationContent).toContain("DialogTitle");
      expect(locationContent).toContain("DialogDescription");
      expect(locationContent).toContain("setSelectedPhoto");
    });

    it("mengatur image sizes responsif pada galeri dan dialog foto", () => {
      expect(locationContent).toContain("(max-width: 640px) 85vw");
      expect(locationContent).toContain("(max-width: 1024px) 50vw");
      expect(locationContent).toContain("33vw");
      expect(locationContent).toContain("(max-width: 768px) 95vw");
    });
  });

  describe("Integrasi Halaman Beranda (app/page.tsx)", () => {
    it("merender DresscodeSection di dalam section #dresscode dengan background bg-secondary", () => {
      expect(pageContent).toContain('import { DresscodeSection }');
      expect(pageContent).toMatch(
        /<section[^>]*id="dresscode"[^>]*className="[^"]*bg-secondary[^"]*"[^>]*>[\s\S]*?<DresscodeSection \/>[\s\S]*?<\/section>/
      );
    });

    it("merender LocationSection di dalam section #lokasi dengan background bg-background", () => {
      expect(pageContent).toContain('import { LocationSection }');
      expect(pageContent).toMatch(
        /<section[^>]*id="lokasi"[^>]*className="[^"]*bg-background[^"]*"[^>]*>[\s\S]*?<LocationSection settings={settings} \/>[\s\S]*?<\/section>/
      );
    });
  });

  describe("Audit Kepatuhan Design System & Token Warna (PRD Bagian B)", () => {
    const filesToAudit = [
      { name: "dresscode-carousel.tsx", content: dresscodeContent },
      { name: "location-section.tsx", content: locationContent },
    ];

    it("tidak memuat kelas warna bawaan Tailwind terlarang (green-[2-9]00, emerald, dsb)", () => {
      const disallowedPatterns = [
        /\btext-green-[2-9]\d{2}\b/,
        /\bbg-green-[2-9]\d{2}\b/,
        /\bborder-green-[2-9]\d{2}\b/,
        /\b(?:text|bg|border)-emerald-\d{2,3}\b/,
        /\b(?:text|bg|border)-yellow-\d{2,3}\b/,
        /\b(?:text|bg|border)-teal-\d{2,3}\b/,
      ];

      filesToAudit.forEach(({ name, content }) => {
        disallowedPatterns.forEach((pattern) => {
          const match = content.match(pattern);
          expect(
            match,
            `File ${name} memuat kelas warna terlarang: ${match?.[0]}`
          ).toBeNull();
        });
      });
    });

    it("hanya memakai warna hijau lembut bermerek 'bg-green-100' untuk aksen ikon", () => {
      expect(locationContent).toContain("bg-green-100");
    });

    it("tidak merubah app/globals.css", () => {
      const globalsCss = fs.readFileSync(
        path.join(__dirname, "../app/globals.css"),
        "utf-8"
      );
      // Memastikan tidak ada token atau import liar
      expect(globalsCss).not.toContain("dresscode");
      expect(globalsCss).not.toContain("location");
    });
  });
});
