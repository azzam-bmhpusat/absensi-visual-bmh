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

import * as userPdf from "@/lib/user-pdf";
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

  it("pencarian bebas mencakup jabatan, peran, status, dan no. WA", () => {
    const ids = (q: string) => filterUsers(users, { status: "all", jabatan: "all", q }).map((u) => u.id);
    expect(ids("ketua")).toEqual(["andi", "cici"]);
    expect(ids("admin")).toEqual(["budi"]);
    expect(ids("nonaktif")).toEqual(["cici"]);
    expect(ids("081 23")).toEqual(["andi", "budi", "cici"]);
    expect(ids("tidak-ada")).toEqual([]);
  });
});

describe("GET /api/admin/manajemen-user/export", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.loadUsers.mockResolvedValue(users);
  });

  it.each(["xlsx", "pdf"])("401 tanpa login dan tidak membaca data (%s)", async (format) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await GET(req(`mode=all&format=${format}`))).status).toBe(401);
    expect(mocks.loadUsers).not.toHaveBeenCalled();
  });

  it.each(["xlsx", "pdf"])("403 untuk non-admin dan tidak membaca data (%s)", async (format) => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await GET(req(`mode=all&format=${format}`))).status).toBe(403);
    expect(mocks.loadUsers).not.toHaveBeenCalled();
  });

  it("400 untuk parameter tidak valid", async () => {
    expect((await GET(req("mode=all&format=csv"))).status).toBe(400);
    expect((await GET(req("mode=filter&format=html"))).status).toBe(400);
    expect((await GET(req("mode=x"))).status).toBe(400);
    expect((await GET(req("mode=filter&status=superadmin"))).status).toBe(400);
  });

  it("mode=all mengekspor semua user sebagai xlsx", async () => {
    const res = await GET(req("mode=all"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toMatch(/manajemen-user-bmh-semua-\d{4}-\d{2}-\d{2}\.xlsx/);
    expect(await readSheet(res)).toEqual(["ANDI", "BUDI", "CICI"]);
  });

  it("mode=filter hanya mengekspor user yang lolos filter", async () => {
    const res = await GET(req("mode=filter&status=peserta&jabatan=Ketua&q=cici"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("sesuai-filter");
    expect(await readSheet(res)).toEqual(["CICI"]);
  });

  it("sheet User hanya berisi No., Nama, Perwakilan daerah, Keterangan kehadiran, Ukuran baju", async () => {
    mocks.loadUsers.mockResolvedValue([
      user("andi", { profile: { ...EMPTY_PROFILE, nama: "Andi", perwakilan_daerah: "Jabar", keterangan_kehadiran: "offline", ukuran_baju: "XL" } }),
      user("budi", { profile: { ...EMPTY_PROFILE, nama: "Budi", keterangan_kehadiran: "online" } }),
    ]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await (await GET(req("mode=all"))).arrayBuffer());
    const ws = wb.getWorksheet("User")!;
    expect(ws.getRow(1).values).toEqual([undefined, "No.", "Nama", "Perwakilan daerah", "Keterangan kehadiran", "Ukuran baju"]);
    expect(ws.getRow(2).values).toEqual([undefined, 1, "Andi", "Jabar", "Offline", "XL"]);
    expect(ws.getRow(3).values).toEqual([undefined, 2, "Budi", "-", "Online", "-"]);
  });

  it("mode=filter menerapkan filter keterangan kehadiran", async () => {
    mocks.loadUsers.mockResolvedValue([
      user("andi", { profile: { ...EMPTY_PROFILE, nama: "ANDI", keterangan_kehadiran: "offline" } }),
      user("budi", { profile: { ...EMPTY_PROFILE, nama: "BUDI", keterangan_kehadiran: "online" } }),
      user("cici"),
    ]);
    expect(await readSheet(await GET(req("mode=filter&kehadiran=online")))).toEqual(["BUDI"]);
    expect(await readSheet(await GET(req("mode=filter&kehadiran=none")))).toEqual(["CICI"]);
    expect((await GET(req("mode=filter&kehadiran=hybrid"))).status).toBe(400);
  });

  it.each(["xlsx", "pdf"])("500 bila daftar user gagal dimuat (%s)", async (format) => {
    mocks.loadUsers.mockResolvedValue(null);
    expect((await GET(req(`mode=all&format=${format}`))).status).toBe(500);
  });

  it("format=pdf mengunduh PDF berisi semua user dalam urutan Excel", async () => {
    const res = await GET(req("mode=all&format=pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Disposition")).toMatch(/manajemen-user-bmh-semua-\d{4}-\d{2}-\d{2}\.pdf/);
    const data = Buffer.from(await res.arrayBuffer());
    expect(res.headers.get("Content-Length")).toBe(String(data.length));
    const pdf = data.toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain("(ANDI)");
    expect(pdf).toContain("(BUDI)");
    expect(pdf).toContain("(CICI)");
    expect(pdf.indexOf("(ANDI)")).toBeLessThan(pdf.indexOf("(BUDI)"));
    expect(pdf.indexOf("(BUDI)")).toBeLessThan(pdf.indexOf("(CICI)"));
  });

  it("PDF mengikuti kombinasi filter status, jabatan, kehadiran, dan pencarian", async () => {
    mocks.loadUsers.mockResolvedValue(users.map((u) => ({
      ...u, profile: { ...u.profile, keterangan_kehadiran: "offline" },
    })));
    const res = await GET(req("mode=filter&format=pdf&status=inactive&jabatan=Ketua&kehadiran=offline&q=cici"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("sesuai-filter");
    const pdf = Buffer.from(await res.arrayBuffer()).toString("latin1");
    expect(pdf).toContain("(CICI)");
    expect(pdf).not.toContain("(ANDI)");
    expect(pdf).not.toContain("(BUDI)");
    expect(pdf).toContain("Status: Nonaktif");
    expect(pdf).toContain("Keterangan kehadiran: Offline");
    expect(pdf).toContain("Pencarian: cici");
  });

  it("menghasilkan PDF valid bila hasil filter kosong", async () => {
    const res = await GET(req("mode=filter&format=pdf&q=tidak-ada"));
    expect(res.status).toBe(200);
    const pdf = Buffer.from(await res.arrayBuffer()).toString("latin1");
    expect(pdf).toContain("Tidak ada pengguna");
    expect(pdf).toContain("Jumlah User: 0");
  });

  it("PDF banyak halaman mengulang header dan menjaga seluruh baris serta tanggal WIB", () => {
    const manyUsers = Array.from({ length: 100 }, (_, i) => user(`PESERTA-${String(i).padStart(3, "0")}`));
    const pdf = userPdf.buildUserPdf({ kind: "all" }, manyUsers, new Date("2026-11-26T18:30:00Z")).toString("latin1");
    const pages = [...pdf.matchAll(/\/Type \/Page\b/g)].length;
    expect(pages).toBeGreaterThan(1);
    expect([...pdf.matchAll(/\(No\.\) Tj/g)]).toHaveLength(pages);
    for (let i = 0; i < 100; i++) expect(pdf).toContain(`(PESERTA-${String(i).padStart(3, "0")})`);
    expect(pdf).toContain("27/11/2026, 01.30 WIB");
    for (let i = 1; i <= pages; i++) expect(pdf).toContain(`Halaman ${i} dari ${pages}`);
  });

  it("500 dengan pesan PDF bila generator gagal", async () => {
    vi.spyOn(userPdf, "buildUserPdf").mockImplementationOnce(() => { throw new Error("generator failed"); });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET(req("mode=all&format=pdf"));
    expect(res.status).toBe(500);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ error: "Gagal membuat file PDF. Silakan coba lagi." });
    log.mockRestore();
  });
});
