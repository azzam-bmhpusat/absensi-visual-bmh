import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";

const mocks = vi.hoisted(() => ({ settings: vi.fn(), read: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/event-settings-server", () => ({ getEventSettings: mocks.settings, readEventSettings: mocks.read }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }) }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), redirect: mocks.redirect }));
vi.mock("@/app/(admin)/pengaturan/actions", () => ({ saveEventSettings: vi.fn() }));
import HomePage, { generateMetadata } from "@/app/(site)/page";
import PengaturanPage from "@/app/(admin)/pengaturan/page";
import { EventSettingsForm } from "@/components/admin/event-settings-form";

describe("event settings integration", () => {
  const settings = {
    ...DEFAULT_EVENT_SETTINGS, venueName: "Gedung Pertemuan Baru", venueAddress: "Jalan Contoh Nomor 10",
    mapsUrl: "https://maps.google.com/?q=-7,110", latitude: -7, longitude: 110,
    startsAt: "2026-12-31T23:30:00+07:00", endsAt: "2027-01-02T15:00:00+07:00",
    footerUrl: "https://example.com/panitia-baru",
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.settings.mockResolvedValue(settings);
    mocks.read.mockResolvedValue({ settings, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("propagates a stored venue, map, schedule and footer link through home and metadata", async () => {
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain("31 Desember 2026–02 Januari 2027");
    expect(html).toContain("31 Desember 2026, 23.30 WIB");
    expect(html).toContain("Jalan Contoh Nomor 10");
    expect(html).toContain("Peta lokasi Gedung Pertemuan Baru");
    expect(html).toContain(`href="${settings.footerUrl}"`);
    expect(html.match(/Gedung Pertemuan Baru/g)!.length).toBeGreaterThanOrEqual(6);
    expect(html.match(/href="https:\/\/maps.google.com\//g)!.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("01 Jan");
    expect(html).toContain("02 Jan");
    expect(html.replace(/<[^>]+>/g, "")).toContain("Rapat Kerja Nasional BMH 2027");
    const metadata = await generateMetadata();
    expect(metadata.description).toContain("31 Desember 2026–02 Januari 2027 di Gedung Pertemuan Baru");
    expect(metadata.description).toContain(settings.venueAddress);
  });

  it("denies the settings page to anonymous users before loading settings", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(PengaturanPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("denies the settings page to logged-in accounts without the admin role", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(PengaturanPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("loads current persisted settings for an authenticated admin on every visit", async () => {
    const element = await PengaturanPage();
    expect(element.props.initialSettings).toEqual(settings);
    mocks.read.mockResolvedValueOnce({ settings: { ...settings, venueName: "Hasil Simpan Terbaru" }, error: null });
    const reloaded = await PengaturanPage();
    expect(reloaded.props.initialSettings.venueName).toBe("Hasil Simpan Terbaru");
    expect(reloaded.key).not.toBe(element.key);
  });

  it("resets the form draft when a failed read recovers after refresh", async () => {
    mocks.read.mockResolvedValueOnce({ settings: DEFAULT_EVENT_SETTINGS, error: "Database tidak tersedia" });
    const unavailable = await PengaturanPage();
    const recovered = await PengaturanPage();
    expect(unavailable.props.loadError).toBeTruthy();
    expect(recovered.props.loadError).toBeNull();
    expect(recovered.props.initialSettings).toEqual(settings);
    expect(recovered.key).not.toBe(unavailable.key);
  });

  it("shows labeled WIB fields with a read-only third-day finish and optional finish time", () => {
    const html = renderToStaticMarkup(createElement(EventSettingsForm, { initialSettings: settings }));
    for (const field of ["venueName", "venueAddress", "mapsUrl", "latitude", "longitude", "footerUrl", "startsAtLocal", "endTime"]) {
      expect(html).toContain(`for="${field}"`);
      expect(html).toContain(`id="${field}"`);
    }
    expect(html).toMatch(/id="endDate"[^>]*readOnly=""[^>]*value="2027-01-02"/);
    expect(html).toContain('value="2026-12-31T23:30"');
    expect(html).toContain('value="15:00"');
    expect(html).toContain("WIB (UTC+7)");
    expect(html).toContain("Simpan Pengaturan");
  });

  it("blocks save and shows an explicit load error when migration/read fails", () => {
    const html = renderToStaticMarkup(createElement(EventSettingsForm, { initialSettings: settings, loadError: "Database belum tersedia" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Database belum tersedia");
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).not.toContain("berhasil disimpan");
  });
});
