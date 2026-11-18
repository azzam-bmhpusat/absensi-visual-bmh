import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }),
}));

import { GET } from "@/app/api/admin/rekap-kehadiran/export/route";

const tables: Record<string, unknown[]> = {
  sessions: [
    { id: 1, nama: "Pagi", hari: 1 },
    { id: 2, nama: "Isoma", hari: 1 },
  ],
  attendances: [
    { id: "a1", session_id: 1, guest_id: "g1", nama: "Ahmad", perwakilan_daerah: "Jatim", is_walk_in: false, checked_in_at: "2026-11-13T01:00:00Z" },
  ],
  guests: [{ id: "g1", nama: "Ahmad", perwakilan_daerah: "Jatim" }],
};

function fakeTable(name: string, eqCalls: unknown[][]) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "order"]) builder[m] = () => builder;
  builder.eq = (...args: unknown[]) => {
    eqCalls.push([name, ...args]);
    return builder;
  };
  builder.range = async () => ({ data: tables[name], error: null });
  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: tables[name], error: null });
  return builder;
}

const req = (qs: string) => new NextRequest(`http://localhost/api/admin/rekap-kehadiran/export?${qs}`);

describe("GET /api/admin/rekap-kehadiran/export", () => {
  let eqCalls: unknown[][];
  beforeEach(() => {
    vi.clearAllMocks();
    eqCalls = [];
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.from.mockImplementation((name: string) => fakeTable(name, eqCalls));
  });

  it("401 tanpa login dan tidak membaca data", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(req("mode=all"));
    expect(res.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(["", "mode=hapus", "mode=session", "mode=session&sesi=abc", "mode=filter&hari=7"])(
    "400 untuk parameter tidak valid (%s)",
    async (qs) => {
      expect((await GET(req(qs))).status).toBe(400);
    }
  );

  it("400 untuk sesi yang tidak ada", async () => {
    expect((await GET(req("mode=session&sesi=9"))).status).toBe(400);
  });

  it("200 mengirim file xlsx untuk satu sesi", async () => {
    const res = await GET(req("mode=session&sesi=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment; filename="rekap-kehadiran-bmh-sesi-1-\d{4}-\d{2}-\d{2}\.xlsx"/);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]); // signature ZIP "PK"
    expect(eqCalls).toContainEqual(["attendances", "session_id", 1]);
  });

  it("200 untuk semua sesi dan sesuai filter", async () => {
    expect((await GET(req("mode=all"))).status).toBe(200);
    expect((await GET(req("mode=filter&hari=all&sesi=all&daerah=Jatim&q=ah"))).status).toBe(200);
  });
});
