import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { EMPTY_PROFILE, filterUsers, NO_JABATAN, type UserRow } from "@/lib/user-row";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), loadUsers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
vi.mock("@/lib/user-list", () => ({ loadUsers: mocks.loadUsers }));

import { GET } from "@/app/api/admin/manajemen-user/export/route";

const user = (id: string, over: Partial<UserRow> = {}, jabatan: string | null = null): UserRow => ({
  id,
  email: `${id}@bmh.or.id`,
  role: "peserta",
  profile: { ...EMPTY_PROFILE, nama: id.toUpperCase(), jabatan, no_whatsapp: "08123" },
  banned: false,
  lastSignInAt: null,
  createdAt: "2026-11-01T01:00:00Z",
  ...over,
});

const users: UserRow[] = [
  user("andi", {}, "Ketua"),
  user("budi", { role: "admin" }),
  user("cici", { banned: true }, "Ketua"),
];

const req = (qs: string) => new NextRequest(`http://localhost/api/admin/manajemen-user/export?${qs}`);

async function readSheet(res: Response) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  const ws = wb.getWorksheet("User")!;
  return ws.getSheetValues().slice(2).map((r) => (r as unknown[])[2]);
}

describe("filterUsers", () => {
  it("menerapkan status, jabatan, dan pencarian email", () => {
    expect(filterUsers(users, { status: "inactive", jabatan: "all", q: "" }).map((u) => u.id)).toEqual(["cici"]);
    expect(filterUsers(users, { status: "peserta", jabatan: "Ketua", q: "" }).map((u) => u.id)).toEqual(["andi", "cici"]);
    expect(filterUsers(users, { status: "all", jabatan: NO_JABATAN, q: "" }).map((u) => u.id)).toEqual(["budi"]);
    expect(filterUsers(users, { status: "all", jabatan: "all", q: "AND" }).map((u) => u.id)).toEqual(["andi"]);
  });
});

describe("GET /api/admin/manajemen-user/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.loadUsers.mockResolvedValue(users);
  });

  it("401 tanpa login dan tidak membaca data", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await GET(req("mode=all"))).status).toBe(401);
    expect(mocks.loadUsers).not.toHaveBeenCalled();
  });

  it("403 untuk non-admin dan tidak membaca data", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await GET(req("mode=all"))).status).toBe(403);
    expect(mocks.loadUsers).not.toHaveBeenCalled();
  });

  it("400 untuk parameter tidak valid", async () => {
    expect((await GET(req("mode=x"))).status).toBe(400);
    expect((await GET(req("mode=filter&status=superadmin"))).status).toBe(400);
  });

  it("mode=all mengekspor semua user sebagai xlsx", async () => {
    const res = await GET(req("mode=all"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toMatch(/manajemen-user-bmh-semua-\d{4}-\d{2}-\d{2}\.xlsx/);
    expect(await readSheet(res)).toEqual(["andi@bmh.or.id", "budi@bmh.or.id", "cici@bmh.or.id"]);
  });

  it("mode=filter hanya mengekspor user yang lolos filter", async () => {
    const res = await GET(req("mode=filter&status=peserta&jabatan=Ketua&q=cici"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("sesuai-filter");
    expect(await readSheet(res)).toEqual(["cici@bmh.or.id"]);
  });

  it("500 bila daftar user gagal dimuat", async () => {
    mocks.loadUsers.mockResolvedValue(null);
    expect((await GET(req("mode=all"))).status).toBe(500);
  });
});
