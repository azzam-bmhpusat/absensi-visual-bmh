import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGuestSearchFilter } from "@/lib/guest-search";

const mock = vi.hoisted(() => ({
  create: vi.fn(),
  createAdmin: vi.fn(),
  query: { from: vi.fn(), select: vi.fn(), not: vi.fn(), or: vi.fn(), order: vi.fn(), range: vi.fn(), abortSignal: vi.fn() },
  avatars: { from: vi.fn(), select: vi.fn(), in: vi.fn(), not: vi.fn(), abortSignal: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({ createPublicServerClient: mock.create }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mock.createAdmin }));

import { GET } from "@/app/api/guests/search/route";

describe("GET /api/guests/search", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.resetAllMocks();
    mock.create.mockReturnValue(mock.query);
    for (const method of ["from", "select", "not", "or", "order", "range"] as const) mock.query[method].mockReturnValue(mock.query);
    mock.query.abortSignal.mockResolvedValue({ data: [], count: 0, error: null });
    mock.createAdmin.mockReturnValue(mock.avatars);
    for (const method of ["from", "select", "in", "not"] as const) mock.avatars[method].mockReturnValue(mock.avatars);
    mock.avatars.abortSignal.mockResolvedValue({ data: [], error: null });
  });

  it("memakai akses publik, pagination stabil, dan hanya mengembalikan detail tamu", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    mock.query.abortSignal.mockResolvedValue({
      data: [{ id: "guest-1", nama: "Ali", perwakilan_daerah: "Jawa Barat", jabatan: null, kategori: "daerah", created_at: "private" }],
      count: 23, error: null,
    });
    mock.avatars.abortSignal.mockResolvedValueOnce({
      data: [{ id: "guest-1", avatar_url: "guest-1/avatar?v=42" }], error: null,
    });
    const response = await GET(new Request("http://localhost/api/guests/search?q=%20Jawa%20%20Barat%20&page=2"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ guests: [{
      id: "guest-1", nama: "Ali", perwakilan_daerah: "Jawa Barat", jabatan: null,
      avatarUrl: "https://test.supabase.co/storage/v1/object/public/avatars/guest-1/avatar?v=42",
    }], total: 23, page: 2, pageSize: 10 });
    expect(mock.avatars.in).toHaveBeenCalledWith("id", ["guest-1"]);
    expect(mock.query.from).toHaveBeenCalledWith("profiles");
    // hanya profil peserta (punya nama), bukan akun admin
    expect(mock.query.not).toHaveBeenCalledWith("nama", "is", null);
    expect(mock.query.select).toHaveBeenCalledWith("id, nama, perwakilan_daerah, jabatan", { count: "exact" });
    expect(mock.query.or).toHaveBeenCalledWith(buildGuestSearchFilter("Jawa Barat"));
    expect(mock.query.order.mock.calls).toEqual([["nama", { ascending: true }], ["id", { ascending: true }]]);
    expect(mock.query.range).toHaveBeenCalledWith(10, 19);
    expect(mock.query.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("mengembalikan hasil kosong tanpa menganggapnya sebagai kegagalan", async () => {
    const response = await GET(new Request("http://localhost/api/guests/search?q=TidakAda"));
    expect(await response.json()).toEqual({ guests: [], total: 0, page: 1, pageSize: 10 });
    expect(mock.createAdmin).not.toHaveBeenCalled();
  });

  it("tetap menampilkan hasil saat data foto gagal dimuat", async () => {
    mock.query.abortSignal.mockResolvedValueOnce({
      data: [{ id: "guest-1", nama: "Ali", perwakilan_daerah: "Jawa Barat", jabatan: null }],
      count: 1, error: null,
    });
    mock.avatars.abortSignal.mockRejectedValueOnce(new Error("avatar lookup failed"));
    const response = await GET(new Request("http://localhost/api/guests/search?q=Ali"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ guests: [{ id: "guest-1", avatarUrl: null }] });
  });

  it.each(["", "?q=a", "?q=Ali&page=0", `?q=${"a".repeat(101)}`])("menolak parameter salah sebelum mengakses database: %s", async (query) => {
    const response = await GET(new Request(`http://localhost/api/guests/search${query}`));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("tidak mengekspos detail kesalahan database", async () => {
    mock.query.abortSignal.mockResolvedValue({ data: null, count: null, error: { message: "database connection secret", code: "XX000" } });
    const response = await GET(new Request("http://localhost/api/guests/search?q=Ali"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Data tamu belum dapat dimuat. Silakan coba lagi." });
  });

  it("mengatasi kegagalan koneksi atau konfigurasi tanpa membocorkan exception", async () => {
    mock.create.mockImplementation(() => { throw new Error("Missing database credentials"); });
    const response = await GET(new Request("http://localhost/api/guests/search?q=Ali"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("credentials");
  });
});
