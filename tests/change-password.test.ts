import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";
import { changePasswordSchema, mustChangePassword, PASSWORD_CHANGED_AT } from "@/lib/password-policy";

const USER_ID = "44444444-4444-4444-8444-444444444444";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  probeSignIn: vi.fn(),
  probeSignOut: vi.fn(),
  updateUserById: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser, signOut: mocks.signOut } }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithPassword: mocks.probeSignIn, signOut: mocks.probeSignOut } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ auth: { admin: { updateUserById: mocks.updateUserById } } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { changePassword } from "@/app/(site)/password/actions";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const VALID = { current: "www.bmh.or.id", next: "Sandi-Baru-2027", confirm: "Sandi-Baru-2027" };
let userSeq = 0;

describe("mustChangePassword", () => {
  it("hanya peserta tanpa penanda yang wajib ganti", () => {
    expect(mustChangePassword({ app_metadata: {} }, "peserta")).toBe(true);
    expect(mustChangePassword({ app_metadata: { [PASSWORD_CHANGED_AT]: "2026-11-23T00:00:00Z" } }, "peserta")).toBe(false);
    expect(mustChangePassword({ app_metadata: {} }, "admin")).toBe(false);
    expect(mustChangePassword({ app_metadata: {} }, "user")).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const issue = (v: Record<string, string>) => changePasswordSchema.safeParse(v).error?.issues[0]?.message;

  it("hanya mensyaratkan minimal 6 karakter (tanpa aturan huruf/angka/simbol)", () => {
    for (const pw of ["abcdef", "123456", "budi12", "aaaaaa"]) {
      expect(issue({ current: "lama", next: pw, confirm: pw })).toBeUndefined();
    }
    expect(issue({ current: "lama", next: "abc12", confirm: "abc12" })).toMatch(/minimal 6/);
  });

  it("konfirmasi harus sama dan panjang maksimal 72", () => {
    expect(issue({ ...VALID, confirm: "lain-12345" })).toMatch(/tidak sama/);
    const long = "a".repeat(73);
    expect(issue({ current: "lama", next: long, confirm: long })).toMatch(/maksimal 72/);
  });
});

describe("changePassword action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userSeq += 1;
    mocks.getUser.mockResolvedValue({
      data: { user: { id: `${USER_ID}-${userSeq}`, email: "budi@bmh.or.id", app_metadata: {} } },
    });
    mocks.probeSignIn.mockResolvedValue({ error: null });
    mocks.updateUserById.mockResolvedValue({ error: null });
  });

  it("menolak bila belum login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await changePassword(null, form(VALID))).toMatchObject({ success: false });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("menolak kata sandi lama yang salah tanpa mengubah apa pun", async () => {
    mocks.probeSignIn.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    expect(await changePassword(null, form(VALID))).toMatchObject({ success: false, field: "current" });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("mengganti kata sandi, menandai app_metadata, dan mencabut sesi lain", async () => {
    expect(await changePassword(null, form(VALID))).toEqual({ success: true });
    expect(mocks.probeSignIn).toHaveBeenCalledWith({ email: "budi@bmh.or.id", password: VALID.current });
    expect(mocks.probeSignOut).toHaveBeenCalledWith({ scope: "local" });
    const [id, attrs] = mocks.updateUserById.mock.calls[0];
    expect(id).toBe(`${USER_ID}-${userSeq}`);
    expect(attrs.password).toBe(VALID.next);
    expect(typeof attrs.app_metadata[PASSWORD_CHANGED_AT]).toBe("string");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "others" });
  });

  it("membatasi percobaan kata sandi lama (5 per 15 menit)", async () => {
    mocks.probeSignIn.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    for (let i = 0; i < 5; i += 1) {
      expect(await changePassword(null, form(VALID))).toMatchObject({ field: "current" });
    }
    expect((await changePassword(null, form(VALID))).error).toMatch(/Terlalu banyak/);
    expect(mocks.probeSignIn).toHaveBeenCalledTimes(5);
  });
});

describe("pemasangan gate", () => {
  const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf-8");

  it("ProfileGate, halaman profil, dan action profil memeriksa mustChangePassword", () => {
    expect(read("components", "rakernas", "profile-gate.tsx")).toContain("<ChangePasswordDialog />");
    expect(read("app", "(site)", "profile", "page.tsx")).toContain("<ChangePasswordDialog />");
    expect(read("app", "(site)", "profile", "actions.ts")).toContain("mustChangePassword(user");
  });

  it("reset kata sandi oleh admin menghapus penanda", () => {
    expect(read("app", "(admin)", "manajemen-user", "actions.ts")).toContain("[PASSWORD_CHANGED_AT]: null");
  });
});
