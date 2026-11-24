import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER_ADMIN = "22222222-2222-4222-8222-222222222222";
const TARGET = "33333333-3333-4333-8333-333333333333";

interface Profile {
  id: string;
  role: "admin" | "peserta" | "user";
}

const state = vi.hoisted(() => ({
  isAdmin: true,
  profiles: [] as { id: string; role: "admin" | "peserta" | "user" }[],
  banned: {} as Record<string, string | null>,
  profileUpdateError: null as null | { code: string; message: string },
  createError: null as null | { code?: string; message: string },
}));

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  createAdminClient: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
  profileUpdates: [] as { values: Record<string, unknown>; id: string }[],
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  createUserAction,
  deleteUserAction,
  setUserActiveAction,
  updateUserAction,
} from "@/app/(admin)/manajemen-user/actions";

/** Query builder palsu untuk tabel profiles. */
function profilesTable() {
  const filters: { op: string; col: string; val: unknown }[] = [];
  let updateValues: Record<string, unknown> | null = null;
  const rows = () =>
    (state.profiles as Profile[]).filter((p) =>
      filters.every((f) => {
        const v = (p as unknown as Record<string, unknown>)[f.col];
        return f.op === "eq" ? v === f.val : v !== f.val;
      })
    );
  const builder: Record<string, unknown> = {
    select: () => builder,
    update: (values: Record<string, unknown>) => {
      updateValues = values;
      return builder;
    },
    eq: (col: string, val: unknown) => {
      filters.push({ op: "eq", col, val });
      return builder;
    },
    neq: (col: string, val: unknown) => {
      filters.push({ op: "neq", col, val });
      return builder;
    },
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => unknown) => {
      if (updateValues) {
        const idFilter = filters.find((f) => f.col === "id");
        mocks.profileUpdates.push({ values: updateValues, id: String(idFilter?.val) });
        return resolve({ error: state.profileUpdateError });
      }
      return resolve({ data: rows(), error: null });
    },
  };
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileUpdates.length = 0;
  state.isAdmin = true;
  state.profileUpdateError = null;
  state.createError = null;
  state.profiles = [
    { id: ME, role: "admin" },
    { id: OTHER_ADMIN, role: "admin" },
    { id: TARGET, role: "peserta" },
  ];
  state.banned = {};

  mocks.getUser.mockImplementation(async () => ({ data: { user: { id: ME } }, error: null }));
  mocks.rpc.mockImplementation(async () => ({ data: state.isAdmin, error: null }));
  mocks.createUser.mockImplementation(async () =>
    state.createError ? { data: { user: null }, error: state.createError } : { data: { user: { id: TARGET } }, error: null }
  );
  mocks.updateUserById.mockResolvedValue({ data: {}, error: null });
  mocks.deleteUser.mockResolvedValue({ data: {}, error: null });
  mocks.getUserById.mockImplementation(async (id: string) => ({
    data: { user: { id, banned_until: state.banned[id] ?? null } },
    error: null,
  }));
  mocks.createAdminClient.mockImplementation(() => ({
    auth: {
      admin: {
        createUser: mocks.createUser,
        updateUserById: mocks.updateUserById,
        deleteUser: mocks.deleteUser,
        getUserById: mocks.getUserById,
      },
    },
    from: (table: string) => {
      if (table !== "profiles") throw new Error("tabel tak terduga: " + table);
      return profilesTable();
    },
  }));
});

describe("otorisasi", () => {
  it.each([
    ["create", () => createUserAction({ email: "a@b.co", password: "rahasia123", role: "user" })],
    ["update", () => updateUserAction(TARGET, { role: "admin" })],
    ["setActive", () => setUserActiveAction(TARGET, false)],
    ["delete", () => deleteUserAction(TARGET)],
  ])("%s ditolak untuk non-admin sebelum menyentuh Auth/service role", async (_n, run) => {
    state.isAdmin = false;
    expect(await run()).toMatchObject({ success: false, error: expect.stringContaining("admin") });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("createUserAction", () => {
  it("membuat peserta: peran profil ditetapkan sesuai pilihan", async () => {
    const res = await createUserAction({ email: "  Baru@BMH.or.id ", password: "rahasia123", role: "peserta" });
    expect(res).toMatchObject({ success: true, message: expect.stringContaining("Peserta") });
    expect(mocks.createUser).toHaveBeenCalledWith({ email: "baru@bmh.or.id", password: "rahasia123", email_confirm: true });
    expect(mocks.profileUpdates).toEqual([{ values: { role: "peserta" }, id: TARGET }]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/manajemen-user");
  });

  it("membuat admin baru: peran profil dinaikkan menjadi admin", async () => {
    const res = await createUserAction({ email: "adm@bmh.or.id", password: "rahasia123", role: "admin" });
    expect(res).toMatchObject({ success: true, message: expect.stringContaining("Admin") });
    expect(mocks.profileUpdates).toEqual([{ values: { role: "admin" }, id: TARGET }]);
  });

  it("membatalkan akun bila peran admin gagal ditetapkan", async () => {
    state.profileUpdateError = { code: "42P01", message: "relation profiles does not exist" };
    const res = await createUserAction({ email: "adm@bmh.or.id", password: "rahasia123", role: "admin" });
    expect(res).toMatchObject({ success: false, error: expect.stringContaining("dibatalkan") });
    expect(mocks.deleteUser).toHaveBeenCalledWith(TARGET);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("menyimpan data profil bersama akun baru", async () => {
    const res = await createUserAction(
      { email: "baru@bmh.or.id", password: "rahasia123", role: "user" },
      { nama: "Budi Santoso", no_whatsapp: "0812-3456-7890" }
    );
    expect(res).toMatchObject({ success: true });
    expect(mocks.profileUpdates).toEqual([
      { values: { nama: "Budi Santoso", no_whatsapp: "081234567890", role: "user" }, id: TARGET },
    ]);
  });

  it("profil tidak valid ditolak sebelum akun dibuat; gagal simpan profil membatalkan akun", async () => {
    const bad = await createUserAction({ email: "a@b.co", password: "rahasia123", role: "user" }, { ukuran_baju: "XS" });
    expect(bad.success).toBe(false);
    expect(mocks.createUser).not.toHaveBeenCalled();

    state.profileUpdateError = { code: "23505", message: "duplicate key" };
    const dup = await createUserAction({ email: "a@b.co", password: "rahasia123", role: "user" }, { nama: "Budi" });
    expect(dup).toMatchObject({ success: false, error: expect.stringContaining("Akun dibatalkan") });
    expect(mocks.deleteUser).toHaveBeenCalledWith(TARGET);
  });

  it("email duplikat → pesan jelas", async () => {
    state.createError = { code: "email_exists", message: "A user with this email address has already been registered" };
    expect(await createUserAction({ email: "ada@bmh.or.id", password: "rahasia123", role: "user" })).toEqual({
      success: false,
      error: "Email sudah terdaftar.",
    });
  });

  it("input tidak valid ditolak sebelum memanggil Auth", async () => {
    const res = await createUserAction({ email: "bukan-email", password: "pendek", role: "user" });
    expect(res.success).toBe(false);
    expect(mocks.createUser).not.toHaveBeenCalled();
    const bad = await createUserAction({ email: "a@b.co", password: "rahasia123", role: "root" as never });
    expect(bad.success).toBe(false);
  });
});

describe("updateUserAction", () => {
  it("mengubah email (terkonfirmasi) dan kata sandi", async () => {
    const res = await updateUserAction(TARGET, { email: "Baru@bmh.or.id", password: "sandi-baru-1" });
    expect(res).toMatchObject({ success: true });
    expect(mocks.updateUserById).toHaveBeenCalledWith(TARGET, {
      email: "baru@bmh.or.id",
      email_confirm: true,
      password: "sandi-baru-1",
    });
    expect(mocks.profileUpdates).toHaveLength(0);
  });

  it("menaikkan user menjadi admin", async () => {
    expect(await updateUserAction(TARGET, { role: "admin" })).toMatchObject({ success: true });
    expect(mocks.profileUpdates).toEqual([{ values: { role: "admin" }, id: TARGET }]);
  });

  it("tidak boleh mengubah peran akun sendiri", async () => {
    const res = await updateUserAction(ME, { role: "user" });
    expect(res).toMatchObject({ success: false, error: expect.stringContaining("sendiri") });
    expect(mocks.profileUpdates).toHaveLength(0);
  });

  it("tidak boleh menurunkan admin terakhir yang aktif", async () => {
    // Pemanggil (ME) sendiri sedang diblokir, jadi TARGET satu-satunya admin aktif.
    state.profiles = [{ id: ME, role: "admin" }, { id: TARGET, role: "admin" }];
    state.banned[ME] = "2126-01-01T00:00:00Z";
    const res = await updateUserAction(TARGET, { role: "user" });
    expect(res).toMatchObject({ success: false, error: expect.stringContaining("terakhir") });
    expect(mocks.profileUpdates).toHaveLength(0);
  });

  it("admin lain yang diblokir tidak dihitung sebagai admin aktif", async () => {
    state.profiles = [{ id: OTHER_ADMIN, role: "admin" }, { id: TARGET, role: "admin" }];
    state.banned[OTHER_ADMIN] = "2126-01-01T00:00:00Z";
    expect(await updateUserAction(TARGET, { role: "user" })).toMatchObject({ success: false });
  });

  it("boleh menurunkan admin bila masih ada admin aktif lain", async () => {
    state.profiles = [{ id: ME, role: "admin" }, { id: TARGET, role: "admin" }];
    state.banned = {};
    // ME dianggap admin aktif lain karena bukan target
    expect(await updateUserAction(TARGET, { role: "user" })).toMatchObject({ success: true });
    expect(mocks.profileUpdates).toEqual([{ values: { role: "user" }, id: TARGET }]);
  });

  it("pengguna tidak ditemukan / ID tidak valid / tanpa perubahan", async () => {
    mocks.getUserById.mockResolvedValueOnce({ data: { user: null }, error: { message: "not found" } });
    expect(await updateUserAction(TARGET, { role: "admin" })).toMatchObject({ success: false, error: "Pengguna tidak ditemukan." });
    expect((await updateUserAction("bukan-uuid", { role: "admin" })).success).toBe(false);
    expect((await updateUserAction(TARGET, {})).success).toBe(false);
  });

  it("hanya data profil yang berubah: tidak menyentuh Auth, kosong -> null", async () => {
    const res = await updateUserAction(TARGET, {}, { departemen: "  Keuangan  ", jabatan: "" });
    expect(res).toMatchObject({ success: true });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.profileUpdates).toEqual([{ values: { departemen: "Keuangan", jabatan: null }, id: TARGET }]);
  });

  it("peran dan profil disimpan dalam satu update", async () => {
    expect(await updateUserAction(TARGET, { role: "admin" }, { ukuran_baju: "XL" })).toMatchObject({ success: true });
    expect(mocks.profileUpdates).toEqual([{ values: { ukuran_baju: "XL", role: "admin" }, id: TARGET }]);
  });

  it("profil tidak valid / field asing ditolak sebelum menyimpan", async () => {
    expect(await updateUserAction(TARGET, {}, { no_whatsapp: "12ab" })).toMatchObject({ success: false });
    expect(await updateUserAction(TARGET, {}, { role: "admin" } as never)).toMatchObject({ success: false });
    expect(mocks.profileUpdates).toHaveLength(0);
  });

  it("nama + perwakilan duplikat (23505) → pesan jelas", async () => {
    state.profileUpdateError = { code: "23505", message: "duplicate key" };
    expect(await updateUserAction(TARGET, {}, { nama: "Budi" })).toEqual({
      success: false,
      error: "Peserta dengan nama dan perwakilan daerah ini sudah terdaftar.",
    });
  });

  it("email duplikat saat mengubah → pesan jelas dan peran tidak diubah", async () => {
    mocks.updateUserById.mockResolvedValueOnce({ data: {}, error: { code: "email_exists", message: "already registered" } });
    const res = await updateUserAction(TARGET, { email: "ada@bmh.or.id", role: "admin" });
    expect(res).toEqual({ success: false, error: "Email sudah terdaftar." });
    expect(mocks.profileUpdates).toHaveLength(0);
  });
});

describe("setUserActiveAction", () => {
  it("menonaktifkan akun biasa dengan ban panjang, mengaktifkan dengan 'none'", async () => {
    expect(await setUserActiveAction(TARGET, false)).toMatchObject({ success: true });
    expect(mocks.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: "876000h" });
    expect(await setUserActiveAction(TARGET, true)).toMatchObject({ success: true });
    expect(mocks.updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: "none" });
  });

  it("tidak boleh menonaktifkan akun sendiri", async () => {
    expect(await setUserActiveAction(ME, false)).toMatchObject({ success: false, error: expect.stringContaining("sendiri") });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("tidak boleh menonaktifkan admin terakhir yang aktif", async () => {
    state.profiles = [{ id: ME, role: "admin" }, { id: TARGET, role: "admin" }];
    state.banned[ME] = "2126-01-01T00:00:00Z";
    expect(await setUserActiveAction(TARGET, false)).toMatchObject({ success: false, error: expect.stringContaining("terakhir") });
  });
});

describe("deleteUserAction", () => {
  it("menghapus akun biasa", async () => {
    expect(await deleteUserAction(TARGET)).toMatchObject({ success: true });
    expect(mocks.deleteUser).toHaveBeenCalledWith(TARGET);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/manajemen-user");
  });

  it("tidak boleh menghapus akun sendiri", async () => {
    expect(await deleteUserAction(ME)).toMatchObject({ success: false, error: expect.stringContaining("sendiri") });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("tidak boleh menghapus admin terakhir yang aktif", async () => {
    state.profiles = [{ id: ME, role: "admin" }, { id: TARGET, role: "admin" }];
    state.banned[ME] = "2126-01-01T00:00:00Z";
    expect(await deleteUserAction(TARGET)).toMatchObject({ success: false, error: expect.stringContaining("terakhir") });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("boleh menghapus admin lain bila admin aktif masih ada", async () => {
    expect(await deleteUserAction(OTHER_ADMIN)).toMatchObject({ success: true });
    expect(mocks.deleteUser).toHaveBeenCalledWith(OTHER_ADMIN);
  });

  it("ID tidak valid ditolak", async () => {
    expect((await deleteUserAction("1; drop table")).success).toBe(false);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});

describe("pemasangan rute & navigasi", () => {
  const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf-8");

  it("rute dilindungi middleware dan matcher serta ada di sidebar", () => {
    expect(read("lib", "supabase", "middleware.ts")).toContain('"/manajemen-user"');
    expect(read("components", "admin", "app-sidebar.tsx")).toContain('href: "/manajemen-user"');
  });

  it("halaman memeriksa admin sebelum memakai service role", () => {
    const page = read("app", "(admin)", "manajemen-user", "page.tsx");
    expect(page).toContain("getAdminUser");
    expect(page.indexOf("getAdminUser(supabase)")).toBeLessThan(page.indexOf("await loadUsers()"));
    expect(page).toContain("/admin/login?error=forbidden");
  });
});
