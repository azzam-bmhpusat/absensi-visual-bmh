import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import nextConfig from "../next.config";
import { config as middlewareConfig } from "../middleware";

vi.mock("@/lib/event-settings-server", () => ({
  getEventSettings: async () => ({
    startsAt: "2026-12-01T10:00:00+07:00",
    endsAt: "2026-12-03T12:00:00+07:00",
    venueName: "Hotel Luminor",
    venueAddress: "Jl. Raya Mangga Besar No.73 1, Jakarta Barat",
    mapsUrl: "https://maps.app.goo.gl/d4RQdTwK9jbx4qZD8",
    footerUrl: "https://bmh.or.id",
  }),
}));

describe("Guardrail: Rute Beranda (/) Bebas dari Redirect ke /absen", () => {
  const pagePath = path.join(__dirname, "../app/(site)/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  it("app/(site)/page.tsx TIDAK mengimpor atau memanggil fungsi redirect", () => {
    expect(pageContent).not.toMatch(/redirect\s*\(\s*["']\/absen["']\s*\)/);
    expect(pageContent).not.toMatch(/import\s*\{[^}]*redirect[^}]*\}\s*from\s*["']next\/navigation["']/);
  });

  it("app/(site)/page.tsx merender struktur Landing Page resmi (S0–S8)", () => {
    // S0: SiteHeader kini dirender oleh shared layout app/(site)/layout.tsx
    const layoutContent = fs.readFileSync(path.join(__dirname, "../app/(site)/layout.tsx"), "utf-8");
    expect(layoutContent).toContain("<SiteHeader");
    // S1: HeroSection
    expect(pageContent).toContain("<HeroSection");
    // S2: CountdownSection
    expect(pageContent).toContain('id="countdown"');
    expect(pageContent).toContain("<CountdownSection");
    // S3: RundownSection
    expect(pageContent).toContain('id="rundown"');
    expect(pageContent).toContain("<RundownSection");
    // S4: DresscodeSection
    expect(pageContent).toContain('id="dresscode"');
    expect(pageContent).toContain("<DresscodeSection");
    // S5: LocationSection
    expect(pageContent).toContain('id="lokasi"');
    expect(pageContent).toContain("<LocationSection");
    // S6: TransportSection
    expect(pageContent).toContain('id="transportasi"');
    expect(pageContent).toContain("<TransportSection");
    // S7: InvitedGuestsSection
    expect(pageContent).toContain('id="tamu-undangan"');
    expect(pageContent).toContain("<InvitedGuestsSection");
    // S8: SiteFooter
    expect(pageContent).toContain("<SiteFooter");
  });

  it("middleware berjalan di semua halaman (sesi login tetap segar) kecuali API & file statis", () => {
    const [source] = middlewareConfig.matcher;
    const matches = (pathname: string) => new RegExp(`^${source}$`).test(pathname);
    for (const p of ["/", "/rundown", "/form", "/login", "/profile", "/informasi-kamar-hotel", "/manajemen-user/x"]) {
      expect(matches(p), p).toBe(true);
    }
    for (const p of ["/_next/static/chunk.js", "/_next/image", "/logo.png", "/favicon.ico", "/api/admin/absen-qr", "/sw.js", "/offline.html", "/manifest.webmanifest", "/icons/icon-192.png"]) {
      expect(matches(p), p).toBe(false);
    }
  });

  it("beranda tetap publik: tidak ada redirect untuk /", () => {
    const mw = fs.readFileSync(path.join(__dirname, "..", "lib", "supabase", "middleware.ts"), "utf-8");
    expect(mw).not.toMatch(/pathname === "\/"[^/]/);
  });

  it("next.config.ts TIDAK memiliki aturan redirect untuk rute /", async () => {
    if (typeof nextConfig.redirects === "function") {
      const redirects = await nextConfig.redirects();
      const rootRedirect = redirects.find((r) => r.source === "/");
      expect(rootRedirect).toBeUndefined();
    } else {
      expect(nextConfig.redirects).toBeUndefined();
    }
  });

  it("Logo pada SiteHeader dan SiteFooter memiliki tautan kembali ke Beranda (/)", () => {
    const headerPath = path.join(__dirname, "../components/rakernas/site-header.tsx");
    const footerPath = path.join(__dirname, "../components/rakernas/site-footer.tsx");

    const headerContent = fs.readFileSync(headerPath, "utf-8");
    const footerContent = fs.readFileSync(footerPath, "utf-8");

    expect(headerContent).toMatch(/<Link[^>]*href="\/"/);
    expect(footerContent).toMatch(/<Link[^>]*href="\/"/);
  });
});
