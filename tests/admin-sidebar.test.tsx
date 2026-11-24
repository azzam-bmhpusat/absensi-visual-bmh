import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/app/admin/actions", () => ({ logoutAdmin: vi.fn() }));

const renderSidebar = (props = {}) => renderToStaticMarkup(
  createElement(SidebarProvider, null, createElement(AppSidebar, props)),
);

describe("Sidebar administrasi", () => {
  it("mempertahankan seluruh tujuan navigasi dan keamanan tautan tab baru", () => {
    const html = renderSidebar();
    for (const href of ["/dashboard", "/rekap-kehadiran", "/kelola-sesi-acara", "/manajemen-user", "/pengaturan", "/admin/qr", "/admin/qr/live"]) {
      expect(html).toContain(`href="${href}"`);
    }
    const links = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
    for (const href of ["/display", "/display-anatomy", "/display-absen", "/absen"]) {
      const link = links.find((tag) => tag.includes(`href="${href}"`));
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener noreferrer"');
    }
    expect(html).toContain("Navigasi administrasi");
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/admin/qr", "/admin/qr"],
    ["/admin/qr/live", "/admin/qr/live"],
    ["/manajemen-user/detail", "/manajemen-user"],
  ])("menandai satu menu aktif pada %s", (pathname, expectedHref) => {
    navigation.pathname = pathname;
    const activeLinks = [...renderSidebar().matchAll(/<a\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter((tag) => tag.includes('aria-current="page"'));
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toContain(`href="${expectedHref}"`);
  });

  it("menampilkan statistik nol dan hanya menawarkan submenu sesi bila tersedia", () => {
    expect(renderSidebar()).not.toContain('aria-label="Daftar sesi Videotron Aula"');
    const html = renderSidebar({ attendancesCount: 0, activeSessionsCount: 0, sessions: [{ id: 4, nama: "Pembukaan" }] });
    expect(html).toContain(">0</span>");
    expect(html).toContain(">0 Aktif</span>");
    expect(html).toContain('aria-label="Daftar sesi Videotron Aula"');
    expect(html).toContain('aria-expanded="false"');
  });
});
