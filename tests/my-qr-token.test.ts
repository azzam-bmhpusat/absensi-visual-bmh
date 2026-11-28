import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  createUserQrToken: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ select: mocks.select }) }),
}));
vi.mock("@/lib/absen-token", () => ({ createUserQrToken: mocks.createUserQrToken }));

import { getMyQrToken } from "@/lib/my-qr-token";

describe("token QR absensi pribadi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "akun-sendiri" } } });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
    mocks.createUserQrToken.mockReturnValue("token-offline");
  });

  it("membuat token hanya untuk akun sendiri dengan kehadiran offline", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { keterangan_kehadiran: "offline" }, error: null });

    expect(await getMyQrToken()).toBe("token-offline");
    expect(mocks.select).toHaveBeenCalledWith("keterangan_kehadiran");
    expect(mocks.eq).toHaveBeenCalledWith("id", "akun-sendiri");
    expect(mocks.createUserQrToken).toHaveBeenCalledExactlyOnceWith("akun-sendiri");
  });

  it.each([
    { data: { keterangan_kehadiran: "online" }, error: null },
    { data: { keterangan_kehadiran: null }, error: null },
    { data: null, error: null },
    { data: null, error: { message: "Gagal membaca profil" } },
    { data: { keterangan_kehadiran: "offline" }, error: { message: "Gagal membaca profil" } },
  ])("tidak membuat token bila status bukan offline atau pembacaan gagal: %j", async (response) => {
    mocks.maybeSingle.mockResolvedValue(response);

    expect(await getMyQrToken()).toBeNull();
    expect(mocks.createUserQrToken).not.toHaveBeenCalled();
  });

  it("tidak membaca profil atau membuat token bila belum login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    expect(await getMyQrToken()).toBeNull();
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.createUserQrToken).not.toHaveBeenCalled();
  });
});
