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
    expect(header).toMatch(/isHome\s*\?\s*href\s*:\s*`\/\$\{href\}`/);
    // Link client-side, bukan <a> biasa yang memuat ulang halaman
    expect(header).toContain("href={navHref(item.href)}");
    expect(header).not.toMatch(/<a\s[^>]*href=\{item\.href\}/);
  });
});
