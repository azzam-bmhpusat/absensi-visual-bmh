import { describe, it, expect } from "vitest";
import {
  SITE_METADATA,
  EVENT_INFO,
  NAV_ITEMS,
  RUNDOWN_DATA,
  DRESSCODE_DATA,
  LOCATION_DATA,
  TRANSPORT_DATA,
  INVITED_GUESTS_CONTENT,
  FOOTER_DATA,
} from "../content/rakernas";

describe("Fase 1 — Konten Bertipe (PRD Rakernas BMH)", () => {
  describe("Kuantitas Item (PRD A.5 & Fase 1 DoD)", () => {
    it("memiliki tepat 10 baris rundown untuk Hari 1", () => {
      expect(RUNDOWN_DATA.hari1).toHaveLength(10);
      expect(RUNDOWN_DATA.hari1[0]).toEqual({ time: "10.00", title: "Check in" });
      expect(RUNDOWN_DATA.hari1[9]).toEqual({
        time: "22.30",
        title: "Istirahat (tidur)",
        note: "tidur",
      });
    });

    it("memiliki fallback terdefinisi untuk Hari 2 dan Hari 3", () => {
      expect(RUNDOWN_DATA.hari2.length).toBeGreaterThan(0);
      expect(RUNDOWN_DATA.hari2[0].title).toBe("Rundown akan segera diumumkan");
      expect(RUNDOWN_DATA.hari3.length).toBeGreaterThan(0);
      expect(RUNDOWN_DATA.hari3[0].title).toBe("Rundown akan segera diumumkan");
    });

    it("memiliki tepat 5 item dress code", () => {
      expect(DRESSCODE_DATA).toHaveLength(5);
      DRESSCODE_DATA.forEach((item, index) => {
        expect(item.src).toBe(`/rakernas/dresscode-${index + 1}.webp`);
        expect(item.alt).toBe(`Dress Code ${index + 1}`);
      });
    });

    it("memiliki tepat 8 foto galeri lokasi dengan urutan keterangan sesuai A.5", () => {
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
      LOCATION_DATA.gallery.forEach((item, idx) => {
        expect(item.caption).toBe(expectedCaptions[idx]);
        expect(item.src).toMatch(/^\/rakernas\/galeri-/);
        expect(item.alt).toBeTruthy();
      });
    });

    it("memiliki tepat 6 titik asal transportasi dengan masing-masing 3 moda/tarif (total 18 tarif)", () => {
      expect(TRANSPORT_DATA.items).toHaveLength(6);
      let totalFares = 0;
      TRANSPORT_DATA.items.forEach((item) => {
        expect(item.fares).toHaveLength(3);
        totalFares += item.fares.length;
        item.fares.forEach((fare) => {
          expect(fare.mode).toBeTruthy();
          expect(fare.price).toMatch(/^Rp\.\s*[\d.,\s-]+$/);
        });
      });
      expect(totalFares).toBe(18);
    });

    it("menyediakan copywriting pencarian dan empat label detail tamu", () => {
      expect(INVITED_GUESTS_CONTENT.title).toBe("Tamu Undangan");
      expect(INVITED_GUESTS_CONTENT.detailsTitle).toBe("Detail Tamu Undangan");
      expect(Object.keys(INVITED_GUESTS_CONTENT.fields)).toEqual(["nama", "perwakilan_daerah", "jabatan", "departemen"]);
    });

    it("memiliki tepat 5 item navigasi header ke S3-S7", () => {
      expect(NAV_ITEMS).toHaveLength(5);
      const expectedHrefs = ["#rundown", "#dresscode", "#lokasi", "#transportasi", "#tamu-undangan"];
      expect(NAV_ITEMS.map((n) => n.href)).toEqual(expectedHrefs);
    });
  });

  describe("Aturan Penggantian Nama (PRD A.3)", () => {
    it("judul dan metadata memakai 'Rakernas BMH' tanpa kata 'Hidayatullah'", () => {
      expect(SITE_METADATA.title).toBe("Rakernas BMH");
      expect(EVENT_INFO.name).toBe("Rakernas BMH");
      expect(EVENT_INFO.title).toBe("Rapat Kerja Nasional BMH 2027");
      expect(EVENT_INFO.title).not.toContain("Hidayatullah");
      expect(EVENT_INFO.logoAlt).toBe("Logo Rakernas BMH 2027");
      expect(EVENT_INFO.logoAlt).not.toContain("Hidayatullah");
      expect(FOOTER_DATA.logoAlt).toBe("Logo Rakernas BMH 2027");
      expect(FOOTER_DATA.logoAlt).not.toContain("Hidayatullah");
    });

    it("tema mengikuti konten acara terkini", () => {
      expect(EVENT_INFO.theme).toBe(
        "Akselerasi Pertumbuhan dan Penguatan Resiliensi Menuju BMH Unggul 2030"
      );
    });

    it("tautan awal panitia mengikuti konten proyek terbaru", () => {
      expect(FOOTER_DATA.committee.label).toBe("Panitia Rakernas");
      expect(FOOTER_DATA.committee.url).toBe("https://wa.me/6289517795206");
    });

  });

  describe("Kevalidan Tautan Eksternal & Target Waktu", () => {
    it("semua tautan eksternal diawali dengan https://", () => {
      const urls = [
        EVENT_INFO.mapsUrl,
        LOCATION_DATA.mapsUrl,
        FOOTER_DATA.committee.url,
      ];

      urls.forEach((url) => {
        expect(url.startsWith("https://")).toBe(true);
      });
    });

    it("countdownTarget merupakan tanggal ISO 8601 yang valid pada 1 Desember 2026 jam 10:00 WIB", () => {
      expect(EVENT_INFO.countdownTarget).toBe("2026-12-01T10:00:00+07:00");
      const parsedTime = Date.parse(EVENT_INFO.countdownTarget);
      expect(Number.isNaN(parsedTime)).toBe(false);
    });
  });
});
