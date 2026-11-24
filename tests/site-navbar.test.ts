import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { NAV_MENU, NAV_ITEMS, PUBLIKASI_MENU } from "../content/rakernas";

const root = path.join(__dirname, "..");
const read = (...p: string[]) => fs.readFileSync(path.join(root, ...p), "utf-8");

describe("Navbar halaman publik", () => {
  it("urutan menu: Beranda, Rundown Acara, Dress Code, Informasi Kamar Hotel, Publikasi", () => {
    expect(NAV_MENU.map((e) => e.label)).toEqual([
      "Beranda",
      "Rundown Acara",
      "Dress Code",
      "Informasi Kamar Hotel",
      "Publikasi",
    ]);
    const hrefs = NAV_MENU.map((e) => e.href);
    expect(hrefs).toEqual(["/", "#rundown", "#dresscode", "/informasi-kamar-hotel", undefined]);
  });

  it("Publikasi memiliki tiga submenu ke halaman baru", () => {
    const publikasi = NAV_MENU.find((e) => e.label === "Publikasi");
    expect(publikasi?.children).toBe(PUBLIKASI_MENU);
    expect(PUBLIKASI_MENU).toEqual([
      { label: "Foto Galeri Kegiatan", href: "/publikasi/foto-galeri-kegiatan" },
      { label: "Materi Presentasi Rakernas", href: "/publikasi/materi-presentasi-rakernas" },
      { label: "Notula Rapat", href: "/publikasi/notula-rapat" },
    ]);
  });

  it("anchor navbar menunjuk ke section yang ada di beranda", () => {
    const home = read("app", "(site)", "page.tsx");
    for (const item of NAV_ITEMS) expect(home).toContain(`id="${item.href.slice(1)}"`);
  });

  it("setiap halaman tujuan ada, memuat judul, dan dibatasi ProfileGate", () => {
    const pages: [string, string][] = [
      ["informasi-kamar-hotel", "Informasi Kamar Hotel"],
      ["publikasi/foto-galeri-kegiatan", "Foto Galeri Kegiatan"],
      ["publikasi/materi-presentasi-rakernas", "Materi Presentasi Rakernas"],
      ["publikasi/notula-rapat", "Notula Rapat"],
    ];
    for (const [route, title] of pages) {
      const file = path.join(root, "app", "(site)", ...route.split("/"), "page.tsx");
      expect(fs.existsSync(file), route).toBe(true);
      const content = fs.readFileSync(file, "utf-8");
      expect(content).toContain(`const TITLE = "${title}"`);
      expect(content).toContain("<PublicPage title={TITLE}>");
      expect(content).toContain(`<ProfileGate path="/${route}">`);
      expect(content).toContain("<ComingSoon");
      expect(content).toContain(`path: "/${route}"`);
    }
  });

  it("header: slot akun di bar atas, Publikasi hover di desktop, tab bar bawah di HP/tablet", () => {
    const header = read("components", "rakernas", "site-header.tsx");
    expect(header).not.toContain("/registrasi");
    expect(header).toContain("{account}");
    expect(header).toContain("openOnHover");
    // Tab bar bawah (HP/tablet) + sheet "Lainnya" dari bawah untuk grup Publikasi
    expect(header).toContain("data-bottom-nav");
    expect(header).toContain('side="bottom"');
    expect(header).toContain("lg:hidden");
    expect(header).toContain("hidden min-w-0 flex-1 items-center justify-center");
    expect(header).toContain("lg:flex");
  });

  it("elemen yang menempel di bawah layar memberi ruang untuk tab bar", () => {
    expect(read("app", "globals.css")).toContain("body:has([data-bottom-nav])");
    expect(read("components", "rakernas", "whatsapp-float.tsx")).toContain("var(--bottom-nav-offset)");
    expect(read("components", "profile", "profile-form.tsx")).toContain("bottom-(--bottom-nav-offset)");
  });
});
