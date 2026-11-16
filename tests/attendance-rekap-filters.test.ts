import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/admin/actions", () => ({ deleteAttendanceAction: vi.fn() }));

import { AttendanceRekapTable } from "@/components/admin/attendance-rekap-table";

describe("Rekap filter labels before opening a dropdown", () => {
  it.each([{ sessions: [] }, { sessions: [{ id: 1, nama: "Absen Masuk Pagi", hari: 1 }] }])("menampilkan label default saat render awal dengan sesi $sessions", ({ sessions }) => {
    const html = renderToStaticMarkup(createElement(AttendanceRekapTable, { attendances: [], sessions }));
    for (const [id, label, defaultText] of [
      ["rekap-filter-hari", "Hari", "Semua Hari"],
      ["rekap-filter-sesi", "Sesi", "Semua Sesi"],
      ["rekap-filter-daerah", "Daerah", "Semua Daerah"],
    ]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`>${label}</label>`);
      const trigger = html.match(new RegExp(`<button(?=[^>]*\\bid="${id}")[^>]*>([\\s\\S]*?)<\\/button>`));
      expect(trigger?.[1]).toContain(defaultText);
      expect(html).toContain(`title="${defaultText}"`);
    }
  });
});
