import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  adminFrom: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: mocks.adminFrom }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import {
  countAttendancesAction,
  deleteAllAttendancesAction,
  deleteSessionAttendancesAction,
} from "@/app/admin/actions";

/** Query builder palsu: setiap metode chain mencatat panggilan, await → result. */
function fakeQuery(result: unknown) {
  const calls: [string, unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "delete", "eq", "gte", "order"]) {
    builder[m] = (...args: unknown[]) => {
      calls.push([m, args]);
      return builder;
    };
  }
  builder.maybeSingle = async () => result;
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return { builder, calls };
}

describe("aksi hapus massal kehadiran", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
  });

  it.each([
    ["deleteSession", () => deleteSessionAttendancesAction(1)],
    ["deleteAll", () => deleteAllAttendancesAction("HAPUS SEMUA")],
    ["count", () => countAttendancesAction("all")],
  ])("%s menolak pengguna anonim sebelum menyentuh database", async (_name, run) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await run()).toMatchObject({ success: false, error: expect.stringContaining("admin") });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("menolak akun login yang bukan admin (role user) sebelum menyentuh database", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect(await deleteAllAttendancesAction("HAPUS SEMUA")).toMatchObject({ success: false, error: expect.stringContaining("admin") });
    expect(mocks.rpc).toHaveBeenCalledWith("is_admin");
    expect(mocks.adminFrom).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("menolak kredensial kedaluwarsa", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: new Error("expired") });
    expect(await deleteAllAttendancesAction("HAPUS SEMUA")).toMatchObject({ success: false });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN])("menolak sessionId tidak valid (%s)", async (id) => {
    expect(await deleteSessionAttendancesAction(id)).toMatchObject({ success: false, error: "Sesi tidak valid." });
    expect(mocks.adminFrom).not.toHaveBeenCalled();
  });

  it("menolak sesi yang tidak ada", async () => {
    const sess = fakeQuery({ data: null, error: null });
    mocks.adminFrom.mockReturnValueOnce(sess.builder);
    expect(await deleteSessionAttendancesAction(42)).toMatchObject({ success: false, error: "Sesi tidak ditemukan." });
    expect(mocks.adminFrom).toHaveBeenCalledTimes(1);
  });

  it("menghapus hanya baris sesi terpilih dan mengembalikan jumlah", async () => {
    const sess = fakeQuery({ data: { id: 3 }, error: null });
    const del = fakeQuery({ count: 17, error: null });
    mocks.adminFrom.mockReturnValueOnce(sess.builder).mockReturnValueOnce(del.builder);

    expect(await deleteSessionAttendancesAction(3)).toEqual({ success: true, data: { deletedCount: 17 } });
    expect(mocks.adminFrom).toHaveBeenLastCalledWith("attendances");
    expect(del.calls).toEqual([
      ["delete", [{ count: "exact" }]],
      ["eq", ["session_id", 3]],
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/rekap-kehadiran");
  });

  it.each(["", "hapus semua", "HAPUS", undefined as unknown as string])(
    "hapus semua wajib frasa konfirmasi tepat (%s)",
    async (text) => {
      expect(await deleteAllAttendancesAction(text)).toMatchObject({ success: false, error: expect.stringContaining("HAPUS SEMUA") });
      expect(mocks.adminFrom).not.toHaveBeenCalled();
    }
  );

  it("hapus semua dengan frasa benar", async () => {
    const del = fakeQuery({ count: 120, error: null });
    mocks.adminFrom.mockReturnValueOnce(del.builder);
    expect(await deleteAllAttendancesAction(" HAPUS SEMUA ")).toEqual({ success: true, data: { deletedCount: 120 } });
    expect(del.calls).toEqual([
      ["delete", [{ count: "exact" }]],
      ["gte", ["session_id", 0]],
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/display");
  });

  it("meneruskan error database tanpa revalidate", async () => {
    const sess = fakeQuery({ data: { id: 1 }, error: null });
    const del = fakeQuery({ count: null, error: { message: "boom" } });
    mocks.adminFrom.mockReturnValueOnce(sess.builder).mockReturnValueOnce(del.builder);
    expect(await deleteSessionAttendancesAction(1)).toMatchObject({ success: false, error: expect.stringContaining("boom") });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("menghitung baris per sesi untuk dialog", async () => {
    mocks.adminFrom
      .mockReturnValueOnce(fakeQuery({ data: [{ id: 1 }, { id: 2 }], error: null }).builder)
      .mockReturnValueOnce(fakeQuery({ count: 5, error: null }).builder)
      .mockReturnValueOnce(fakeQuery({ count: 0, error: null }).builder);
    expect(await countAttendancesAction("all")).toEqual({
      success: true,
      data: { total: 5, perSession: [{ session_id: 1, count: 5 }, { session_id: 2, count: 0 }] },
    });
  });
});
