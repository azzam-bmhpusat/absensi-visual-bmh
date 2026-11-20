import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGuestSearchFilter, REGISTRATION_SEARCH_COLUMNS } from "@/lib/guest-search";

const mock = vi.hoisted(() => ({
  create: vi.fn(),
  rate: vi.fn(),
  query: {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    abortSignal: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mock.create }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mock.rate }));

import { GET } from "@/app/api/registrations/search/route";

describe("GET /api/registrations/search", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.create.mockReturnValue(mock.query);
    mock.rate.mockReturnValue(true);
    for (const method of ["from", "select", "eq", "or", "order", "range"] as const) {
      mock.query[method].mockReturnValue(mock.query);
    }
    mock.query.abortSignal.mockResolvedValue({ data: [], count: 0, error: null });
  });

  it("hanya membaca pendaftar pending dan mengembalikan kolom publik saja", async () => {
    mock.query.abortSignal.mockResolvedValue({
      data: [
        {
          id: "reg-1",
          nama: "Ali",
          perwakilan_bmh: "BMH Jawa Barat",
          jabatan: "Kepala Perwakilan",
          departemen: null,
          ukuran_baju: "L",
          mode_kehadiran: "online",
          status: "pending",
        },
      ],
      count: 11,
      error: null,
    });
    const response = await GET(new Request("http://localhost/api/registrations/search?q=Ali&page=2"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      registrations: [
        { id: "reg-1", nama: "Ali", perwakilan_bmh: "BMH Jawa Barat", jabatan: "Kepala Perwakilan", departemen: null },
      ],
      total: 11,
      page: 2,
      pageSize: 10,
    });
    expect(mock.query.from).toHaveBeenCalledWith("registrations");
    expect(mock.query.select).toHaveBeenCalledWith("id, nama, perwakilan_bmh, jabatan, departemen", { count: "exact" });
    expect(mock.query.eq).toHaveBeenCalledWith("status", "pending");
    expect(mock.query.or).toHaveBeenCalledWith(buildGuestSearchFilter("Ali", REGISTRATION_SEARCH_COLUMNS));
    expect(mock.query.range).toHaveBeenCalledWith(10, 19);
  });

  it.each(["", "?q=a", "?q=Ali&page=0", `?q=${"a".repeat(101)}`])(
    "menolak parameter salah sebelum mengakses database: %s",
    async (query) => {
      const response = await GET(new Request(`http://localhost/api/registrations/search${query}`));
      expect(response.status).toBe(400);
      expect(mock.create).not.toHaveBeenCalled();
    }
  );

  it("membatasi laju permintaan per IP", async () => {
    mock.rate.mockReturnValue(false);
    const response = await GET(
      new Request("http://localhost/api/registrations/search?q=Ali", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })
    );
    expect(response.status).toBe(429);
    expect(mock.rate).toHaveBeenCalledWith("regsearch:1.2.3.4", 60);
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("tidak mengekspos detail kesalahan database", async () => {
    mock.query.abortSignal.mockResolvedValue({ data: null, count: null, error: { message: "secret", code: "XX000" } });
    const response = await GET(new Request("http://localhost/api/registrations/search?q=Ali"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
});
