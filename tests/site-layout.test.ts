import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf-8");

describe("Shared layout situs publik: app/(site)", () => {
  const layout = read("app", "(site)", "layout.tsx");
  const home = read("app", "(site)", "page.tsx");
  const registrasi = read("app", "(site)", "registrasi", "page.tsx");
  const header = read("components", "rakernas", "site-header.tsx");

  it("layout memasang SiteHeader dan SmoothScroll satu kali untuk semua halaman (site)", () => {
    expect(layout).toContain("<SiteHeader");
    expect(layout).toContain("<SmoothScroll");
    expect(layout).toContain("{children}");
  });

  it("layout memasang popup WhatsApp yang tautannya mengikuti footer_url event settings", () => {
    const slot = read("components", "rakernas", "whatsapp-float-slot.tsx");
    const float = read("components", "rakernas", "whatsapp-float.tsx");
    expect(layout).toContain("<WhatsAppFloatSlot");
    expect(slot).toContain("getEventSettings");
    expect(slot).toContain("href={footerUrl}");
    expect(float).toContain("const LOGO_MS = 2000");
    expect(float).toContain("const IMAGE_MS = 1000");
    expect(float).toContain("/whatsapp-popup.jpeg");
    expect(float).toContain("fixed bottom-");
    // Gambar seukuran logo: lingkaran 56 px, tanpa kartu portrait besar
    expect(float).toContain("size-14");
    expect(float).toContain("rounded-full");
    expect(float).not.toContain("h-32 w-24");
  });

  it("beranda dan registrasi tidak merender navbar sendiri (memakai layout)", () => {
    expect(home).not.toContain("<SiteHeader");
    expect(home).not.toContain("<SmoothScroll");
    expect(registrasi).not.toContain("<SiteHeader");
    expect(registrasi).not.toMatch(/<header[\s>]/);
  });

  it("beranda dan registrasi berada di route group (site) dan tidak tersisa di app/ langsung", () => {
    expect(fs.existsSync(path.join(__dirname, "..", "app", "page.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, "..", "app", "registrasi"))).toBe(false);
  });

  it("menu navbar menuju '/#section' saat berada di luar beranda", () => {
    expect(header).toContain("usePathname");
    // Anchor "#id" menjadi "/#id" di luar beranda; halaman lain tetap memakai href-nya
    expect(header).toMatch(/href\.startsWith\("#"\)\s*&&\s*!isHome\s*\?\s*`\/\$\{href\}`/);
    // Link client-side, bukan <a> biasa yang memuat ulang halaman
    expect(header).toContain("href={resolveHref(entry.href)}");
    expect(header).not.toMatch(/<a\s[^>]*href=\{entry\.href\}/);
  });
});
