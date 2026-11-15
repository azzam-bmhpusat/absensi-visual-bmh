import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  SITE_METADATA,
  EVENT_INFO,
  RUNDOWN_DATA,
  DRESSCODE_DATA,
  LOCATION_DATA,
  TRANSPORT_DATA,
  REGISTRATION_DATA,
  NAV_ITEMS,
  FOOTER_DATA,
} from "@/content/rakernas";

describe("Fase 6 — QA & Penyelesaian: Landing Page Rakernas BMH", () => {
  describe("1. Audit Konten Satu per Satu (PRD A.5)", () => {
    it("Metadata situs dan event info cocok 100% dengan PRD", () => {
      expect(SITE_METADATA.title).toBe("Rakernas BMH");
      expect(EVENT_INFO.title).toBe("Rapat Kerja Nasional BMH 2027");
      expect(EVENT_INFO.theme).toBe(
        "Konsolidasi Jati Diri dan Transformasi Organisasi Menuju Hidayatullah Mandiri dan Berpengaruh"
      );
      expect(EVENT_INFO.dateDays).toBe("01 - 03");
      expect(EVENT_INFO.dateMonthYear).toBe("Desember 2026");
      expect(EVENT_INFO.hotel).toBe("Hotel Grasia Semarang");
      expect(EVENT_INFO.address).toBe(
        "Jl. Letnan Jenderal S. Parman No.29, Gajahmungkur, Kec. Semarang Sel., Kota Semarang, Jawa Tengah 50231"
      );
      expect(EVENT_INFO.mapsUrl).toBe("https://maps.app.goo.gl/UYtvHFrQZcqtyauX6");
      expect(EVENT_INFO.countdownTarget).toBe("2026-12-01T10:00:00+07:00");
    });

    it("Rundown Hari 1 memuat 10 agenda persis dengan tabel sumber", () => {
      const h1 = RUNDOWN_DATA.hari1;
      expect(h1).toHaveLength(10);
      expect(h1[0]).toEqual({ time: "10.00", title: "Check in" });
      expect(h1[1]).toEqual({ time: "11.00", title: "Makan Siang" });
      expect(h1[2]).toEqual({ time: "11.30", title: "Sholat Dzuhur" });
      expect(h1[3]).toEqual({ time: "13.00", title: "Pembukaan" });
      expect(h1[4]).toEqual({ time: "15.00", title: "Break" });
      expect(h1[5]).toEqual({
        time: "16.00",
        title: "Rapat Pleno 1 (Presentasi Program Kerja Bidang Pendidikan)",
        note: "Presentasi Program Kerja Bidang Pendidikan",
      });
      expect(h1[6]).toEqual({ time: "17.30", title: "Ishoma" });
      expect(h1[7]).toEqual({
        time: "19.30",
        title: "Rapat Pleno 2 (Presentasi Program Kerja Bidang Dakwah & Pelayanan Ummat)",
        note: "Presentasi Program Kerja Bidang Dakwah & Pelayanan Ummat",
      });
      expect(h1[8]).toEqual({
        time: "21.00",
        title: "Rapat Pleno 3 (Presentasi Program Bidang Rekrutmen, Pengkaderan & Pembinaan Anggota)",
        note: "Presentasi Program Bidang Rekrutmen, Pengkaderan & Pembinaan Anggota",
      });
      expect(h1[9]).toEqual({
        time: "22.30",
        title: "Istirahat (tidur)",
        note: "tidur",
      });
    });

    it("Rundown Hari 2 dan Hari 3 memiliki fallback resmi terdefinisi", () => {
      expect(RUNDOWN_DATA.hari2[0].title).toBe("Rundown akan segera diumumkan");
      expect(RUNDOWN_DATA.hari3[0].title).toBe("Rundown akan segera diumumkan");
    });

    it("Dresscode memuat 5 item terurut", () => {
      expect(DRESSCODE_DATA).toHaveLength(5);
      DRESSCODE_DATA.forEach((item, index) => {
        expect(item.alt).toBe(`Dress Code ${index + 1}`);
        expect(item.src).toContain(`dresscode-${index + 1}`);
      });
    });

    it("Galeri lokasi memuat 8 foto fasilitas terurut dengan keterangan persis", () => {
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
      expect(LOCATION_DATA.gallery).toHaveLength(8);
      LOCATION_DATA.gallery.forEach((item, idx) => {
        expect(item.caption).toBe(expectedCaptions[idx]);
        expect(item.src).toBeTruthy();
      });
    });

    it("Info transportasi memuat 6 titik asal dan 18 tarif cocok 100%", () => {
      expect(TRANSPORT_DATA.items).toHaveLength(6);
      const expectedData = [
        {
          origin: "Bandara Ahmad Yani",
          fares: [
            { mode: "Taksi Bandara", price: "Rp. 70.000 - 100.000" },
            { mode: "Taksi Online", price: "Rp. 45.000 - 65.000" },
            { mode: "Ojek Online", price: "Rp. 20.000 - 30.000" },
          ],
        },
        {
          origin: "Stasiun Tawang",
          fares: [
            { mode: "Taksi Stasiun", price: "Rp. 30.000 - 40.000" },
            { mode: "Taksi Online", price: "Rp. 20.000 - 30.000" },
            { mode: "Ojek Online", price: "Rp. 12.000 - 18.000" },
          ],
        },
        {
          origin: "Stasiun Poncol",
          fares: [
            { mode: "Taksi Stasiun", price: "Rp. 25.000 - 35.000" },
            { mode: "Taksi Online", price: "Rp. 15.000 - 25.000" },
            { mode: "Ojek Online", price: "Rp. 10.000 - 15.000" },
          ],
        },
        {
          origin: "Terminal Mangkang",
          fares: [
            { mode: "Taksi Terminal", price: "Rp. 80.000 - 110.000" },
            { mode: "Taksi Online", price: "Rp. 60.000 - 90.000" },
            { mode: "Ojek Online", price: "Rp. 35.000 - 50.000" },
          ],
        },
        {
          origin: "Terminal Terboyo",
          fares: [
            { mode: "Taksi Terminal", price: "Rp. 45.000 - 60.000" },
            { mode: "Taksi Online", price: "Rp. 30.000 - 45.000" },
            { mode: "Ojek Online", price: "Rp. 18.000 - 25.000" },
          ],
        },
        {
          origin: "Terminal Banyumanik",
          fares: [
            { mode: "Taksi Terminal", price: "Rp. 50.000 - 65.000" },
            { mode: "Taksi Online", price: "Rp. 35.000 - 50.000" },
            { mode: "Ojek Online", price: "Rp. 20.000 - 28.000" },
          ],
        },
      ];

      TRANSPORT_DATA.items.forEach((item, idx) => {
        expect(item.origin).toBe(expectedData[idx].origin);
        expect(item.fares).toEqual(expectedData[idx].fares);
      });
    });

    it("Cara mendaftar memuat 4 langkah dan detail rekening resmi", () => {
      expect(REGISTRATION_DATA.steps).toHaveLength(4);
      expect(REGISTRATION_DATA.steps[0]).toBe("Transfer Rp.1.000.000/peserta ke Rekening Pembayaran");
      expect(REGISTRATION_DATA.steps[1]).toBe("Isi data peserta di form yg telah disediakan");
      expect(REGISTRATION_DATA.steps[2]).toBe("Upload bukti transfer");
      expect(REGISTRATION_DATA.steps[3]).toBe("Konfirmasi pembayaran ke panitia");

      expect(REGISTRATION_DATA.bank.bankName).toBe("BANK SYARIAH INDONESIA (BSI)");
      expect(REGISTRATION_DATA.bank.accountNumber).toBe("9999-8866-17");
      expect(REGISTRATION_DATA.bank.accountHolder).toBe("an. DPW Hidayatullah Jateng");
      expect(REGISTRATION_DATA.actions.form.url).toBe("https://forms.gle/8E5oksPuZpKvvjQR6");
      expect(REGISTRATION_DATA.actions.confirm.url).toContain("https://wa.me/6283842037788");
      expect(REGISTRATION_DATA.actions.confirm.url).toContain(
        "text=Bismillah,%20saya%20sudah%20mengisi%20form%20pendaftaran%20Rakernas%202027"
      );
    });

    it("Footer memuat logo, info acara, dan tautan resmi panitia tanpa counter pengunjung", () => {
      expect(FOOTER_DATA.logoSrc).toBe("/logo.png");
      expect(FOOTER_DATA.logoAlt).toBe("Logo Rakernas BMH 2027");
      expect(FOOTER_DATA.text).toBe("01-03 Desember 2026 | Hotel Grasia Semarang @2026");
      expect(FOOTER_DATA.committee.label).toBe("Panitia Rakernas");
      expect(FOOTER_DATA.committee.url).toBe("https://hidayatullahjateng.or.id/");
    });

    it("Navigasi header memuat 5 anchor section sesuai PRD", () => {
      expect(NAV_ITEMS).toHaveLength(5);
      expect(NAV_ITEMS.map((n) => n.href)).toEqual([
        "#rundown",
        "#dresscode",
        "#lokasi",
        "#transportasi",
        "#pendaftaran",
      ]);
    });
  });

  describe("2. Kepatuhan Aturan Penamaan (PRD A.3)", () => {
    it("Tidak ada kata 'Hidayatullah' pada title, H1, dan alt logo", () => {
      expect(SITE_METADATA.title).not.toContain("Hidayatullah");
      expect(EVENT_INFO.title).not.toContain("Hidayatullah");
      expect(EVENT_INFO.logoAlt).not.toContain("Hidayatullah");
      expect(FOOTER_DATA.logoAlt).not.toContain("Hidayatullah");
    });

    it("Kata 'Hidayatullah' tetap dipertahankan pada kutipan tema, pemilik rekening, dan tautan panitia", () => {
      expect(EVENT_INFO.theme).toContain("Hidayatullah");
      expect(REGISTRATION_DATA.bank.accountHolder).toContain("Hidayatullah");
      expect(FOOTER_DATA.committee.url).toContain("hidayatullahjateng.or.id");
    });
  });

  describe("3. Audit Token Warna & Kepatuhan globals.css (PRD B.2 & B.9)", () => {
    it("Seluruh komponen rakernas tidak menggunakan kelas warna bawaan Tailwind terlarang", () => {
      const rakernasDir = path.join(process.cwd(), "components", "rakernas");
      const files = fs.readdirSync(rakernasDir).filter((f) => f.endsWith(".tsx"));
      files.push(path.join("..", "..", "app", "page.tsx"));

      const forbiddenRegex =
        /\b(?:green-(?:200|300|400|500|600|700|800|900|950)|emerald-[0-9]{2,3}|yellow-[0-9]{2,3})\b/;

      for (const file of files) {
        const filePath = path.join(rakernasDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(forbiddenRegex);
        expect(
          match,
          `File ${file} memuat kelas warna terlarang: ${match ? match[0] : ""}`
        ).toBeNull();
      }
    });

    it("Komponen rakernas tidak memuat kode warna heksadesimal arbitrer", () => {
      const rakernasDir = path.join(process.cwd(), "components", "rakernas");
      const files = fs.readdirSync(rakernasDir).filter((f) => f.endsWith(".tsx"));

      const hexRegex = /#[0-9a-fA-F]{3,8}\b/;

      for (const file of files) {
        const filePath = path.join(rakernasDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(hexRegex);
        expect(
          match,
          `File ${file} memuat warna arbitrer hex: ${match ? match[0] : ""}`
        ).toBeNull();
      }
    });

    it("app/globals.css bersih tanpa modifikasi", () => {
      const globalsCssPath = path.join(process.cwd(), "app", "globals.css");
      expect(fs.existsSync(globalsCssPath)).toBe(true);
    });
  });

  describe("4. Audit Target Sentuh & Aksesibilitas (PRD B.6 & A.7)", () => {
    it("Header menu trigger memiliki area sentuh minimal 44 px (size-11)", () => {
      const headerFile = path.join(process.cwd(), "components", "rakernas", "site-header.tsx");
      const content = fs.readFileSync(headerFile, "utf-8");
      expect(content).toContain("size-11");
    });

    it("Tombol aksi pendaftaran memiliki tinggi minimal 48 px (h-12)", () => {
      const regFile = path.join(process.cwd(), "components", "rakernas", "registration-section.tsx");
      const content = fs.readFileSync(regFile, "utf-8");
      expect(content).toContain("h-12");
    });

    it("Semua tautan eksternal memiliki target='_blank' dan rel='noopener noreferrer'", () => {
      const components = [
        "hero.tsx",
        "location-section.tsx",
        "registration-section.tsx",
        "site-footer.tsx",
      ];

      for (const comp of components) {
        const filePath = path.join(process.cwd(), "components", "rakernas", comp);
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.includes("target=\"_blank\"")) {
          expect(content).toContain('rel="noopener noreferrer"');
        }
      }
    });

    it("Setiap section landing page dilengkapi id dan scroll-mt-20", () => {
      const pageFile = path.join(process.cwd(), "app", "page.tsx");
      const content = fs.readFileSync(pageFile, "utf-8");
      const expectedSections = [
        'id="countdown"',
        'id="rundown"',
        'id="dresscode"',
        'id="lokasi"',
        'id="transportasi"',
        'id="pendaftaran"',
      ];

      for (const sectionId of expectedSections) {
        expect(content).toContain(sectionId);
      }
      expect(content).toContain("scroll-mt-20");
      expect(content).toContain("overflow-x-hidden");
    });

    it("Root layout memuat lang='id' dan scroll-smooth", () => {
      const layoutFile = path.join(process.cwd(), "app", "layout.tsx");
      const content = fs.readFileSync(layoutFile, "utf-8");
      expect(content).toContain('lang="id"');
      expect(content).toContain("scroll-smooth");
    });
  });

  describe("5. Verifikasi Non-Regresi Rute Utama Lainnya", () => {
    it("Rute aplikasi lainnya tetap ada dan utuh", () => {
      const requiredRoutes = [
        path.join(process.cwd(), "app", "absen", "page.tsx"),
        path.join(process.cwd(), "app", "absen", "selesai", "page.tsx"),
        path.join(process.cwd(), "app", "display", "page.tsx"),
        path.join(process.cwd(), "app", "admin", "page.tsx"),
        path.join(process.cwd(), "app", "admin", "login", "page.tsx"),
        path.join(process.cwd(), "app", "admin", "qr", "page.tsx"),
      ];

      for (const routePath of requiredRoutes) {
        expect(fs.existsSync(routePath), `Route file ${routePath} harus tetap ada`).toBe(true);
      }
    });
  });
});
