import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
import { getPrivacyContact, PRIVACY_SECTIONS } from "@/lib/privacy-policy";
import KebijakanPrivasiPage, { metadata } from "@/app/(site)/kebijakan-privasi/page";

const contactSettings = vi.hoisted(() => ({ footerUrl: "https://wa.me/6281234567890?text=Halo%20panitia" }));
vi.mock("@/lib/event-settings-server", () => ({
  getEventSettings: vi.fn(async () => ({ ...DEFAULT_EVENT_SETTINGS, footerUrl: contactSettings.footerUrl })),
}));

const read = (file: string) => fs.readFileSync(path.join(__dirname, "..", file), "utf-8");

// Google mensyaratkan kebijakan privasi publik untuk verifikasi merek aplikasi OAuth.
describe("/kebijakan-privasi", () => {
  const page = read("app/(site)/kebijakan-privasi/page.tsx");

  beforeEach(() => {
    contactSettings.footerUrl = "https://wa.me/6281234567890?text=Halo%20panitia";
  });

  it("merender enam bagian kebijakan, navigasi, dan tanggal yang disepakati", async () => {
    const html = renderToStaticMarkup(await KebijakanPrivasiPage());
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("24 November 2026");
    for (const { id, title } of PRIVACY_SECTIONS) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`href="#${id}"`);
      expect(html).toContain(title);
    }
    for (const text of ["Login dengan Google", "Akun peserta", "Kehadiran", "Supabase", "Vercel", "Kami tidak menjual data Anda"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="https://myaccount.google.com/connections"');
    expect(metadata.title).toBe("Kebijakan Privasi");
    expect(metadata.description).toContain("penghapusannya");
  });

  it("semua kontak memakai footer_url pengaturan dan mempertahankan pesan", async () => {
    const html = renderToStaticMarkup(await KebijakanPrivasiPage());
    const contacts = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)]
      .map(([tag, href]) => ({ tag, href }))
      .filter(({ href }) => href.includes("wa.me"));
    expect(contacts.length).toBeGreaterThanOrEqual(3);
    for (const { tag, href } of contacts) {
      expect(href).toBe(contactSettings.footerUrl);
      expect(tag).toContain('rel="noopener noreferrer"');
    }
    expect(html.match(/081234567890/g)).toHaveLength(2);
    expect(html).not.toContain("0812-0000-0000");
    contactSettings.footerUrl = "https://api.whatsapp.com/send?phone=6287771234567";
    const updatedHtml = renderToStaticMarkup(await KebijakanPrivasiPage());
    expect(updatedHtml).toContain("087771234567");
    expect(updatedHtml).not.toContain("081234567890");
  });

  it("memakai label umum bila pengaturan berisi URL tanpa nomor WhatsApp", async () => {
    contactSettings.footerUrl = "https://example.com/kontak";
    const html = renderToStaticMarkup(await KebijakanPrivasiPage());
    expect(html).toContain('href="https://example.com/kontak"');
    expect(html).toContain("Hubungi Panitia");
    expect(html).not.toContain("081234567890");
  });

  it("dapat merender kontak dari fallback pengaturan yang sudah tersedia", async () => {
    contactSettings.footerUrl = DEFAULT_EVENT_SETTINGS.footerUrl;
    const html = renderToStaticMarkup(await KebijakanPrivasiPage());
    expect(html).toContain(`href="${DEFAULT_EVENT_SETTINGS.footerUrl}"`);
    expect(html).toContain(getPrivacyContact(DEFAULT_EVENT_SETTINGS.footerUrl).label);
  });

  it("publik: tidak dibatasi login di middleware maupun ProfileGate", () => {
    expect(read("lib/supabase/middleware.ts")).not.toContain("/kebijakan-privasi");
    expect(page).not.toContain("ProfileGate");
  });

  it("ditautkan dari footer dan halaman login", () => {
    expect(read("components/rakernas/site-footer.tsx")).toContain('href="/kebijakan-privasi"');
    expect(read("components/auth/login-form.tsx")).toContain('href="/kebijakan-privasi"');
  });
});

describe("nomor kontak dari footer_url", () => {
  it.each([
    ["https://wa.me/6281234567890", "081234567890"],
    ["https://wa.me/+6281234567890/", "081234567890"],
    ["https://api.whatsapp.com/send?phone=6281234567890&text=Halo", "081234567890"],
    ["https://api.whatsapp.com/send?phone=%2B62%20812-3456-7890", "081234567890"],
    ["https://wa.me/081234567890", "081234567890"],
    ["https://wa.me/447700900123", "+447700900123"],
  ])("membaca %s tanpa mengubah tujuan tautan", (url, phone) => {
    expect(getPrivacyContact(url)).toEqual({ href: url, phone, label: phone });
  });

  it.each([
    "https://example.com/6281234567890",
    "https://wa.me/message/ABC123",
    "https://api.whatsapp.com/send?phone=bukan-nomor",
    "https://api.whatsapp.com/6281234567890",
    "http://wa.me/6281234567890",
    "bukan-url",
  ])("tidak mengarang nomor dari %s", (url) => {
    expect(getPrivacyContact(url)).toEqual({ href: url, phone: null, label: "Hubungi Panitia" });
  });
});
