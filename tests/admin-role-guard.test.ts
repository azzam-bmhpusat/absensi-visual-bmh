import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { checkAdmin, getAdminUser } from "@/lib/auth/admin";

const root = path.join(__dirname, "..");
const read = (...p: string[]) => fs.readFileSync(path.join(root, ...p), "utf-8");

function client(opts: { user?: unknown; authError?: unknown; rpc?: { data: unknown; error: unknown } }) {
  const rpc = vi.fn().mockResolvedValue(opts.rpc ?? { data: true, error: null });
  return {
    rpc,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null }, error: opts.authError ?? null }) },
  } as never as Parameters<typeof checkAdmin>[0] & { rpc: typeof rpc };
}

describe("getAdminUser / checkAdmin", () => {
  const user = { id: "u1", email: "a@bmh.or.id" };

  it("admin: mengembalikan pengguna dan memanggil is_admin", async () => {
    const c = client({ user });
    expect(await getAdminUser(c)).toBe(user);
    expect(c.rpc).toHaveBeenCalledWith("is_admin");
  });

  it("akun role user: login valid tetapi bukan admin", async () => {
    const c = client({ user, rpc: { data: false, error: null } });
    expect(await checkAdmin(c)).toEqual({ user, isAdmin: false });
    expect(await getAdminUser(c)).toBeNull();
  });

  it("tanpa sesi atau sesi kedaluwarsa: tidak memanggil is_admin", async () => {
    const none = client({});
    expect(await checkAdmin(none)).toEqual({ user: null, isAdmin: false });
    expect(none.rpc).not.toHaveBeenCalled();
    const expired = client({ user, authError: new Error("expired") });
    expect(await getAdminUser(expired)).toBeNull();
    expect(expired.rpc).not.toHaveBeenCalled();
  });

  it("fail-closed bila rpc error (mis. migrasi belum dijalankan) atau hasil bukan true", async () => {
    expect(await getAdminUser(client({ user, rpc: { data: null, error: new Error("function not found") } }))).toBeNull();
    expect(await getAdminUser(client({ user, rpc: { data: "true", error: null } }))).toBeNull();
  });
});

describe("Penerapan role admin di aplikasi", () => {
  it("middleware menolak non-admin ke /admin/login?error=forbidden dan tidak me-redirect-loop", () => {
    const mw = read("lib", "supabase", "middleware.ts");
    expect(mw).toContain("checkAdmin");
    expect(mw).toContain('forbiddenUrl.search = "?error=forbidden"');
    expect(mw).toMatch(/pathname\.startsWith\("\/admin\/login"\) && user && isAdmin/);
  });

  it("tidak ada pengecekan admin berbasis 'sudah login' saja yang tersisa", () => {
    const files = [
      ["app", "admin", "actions.ts"],
      ["app", "(admin)", "pengaturan", "actions.ts"],
      ["app", "(admin)", "pengaturan", "page.tsx"],
      ["app", "api", "admin", "absen-qr", "route.ts"],
      ["app", "api", "admin", "rekap-kehadiran", "export", "route.ts"],
    ];
    for (const f of files) expect(read(...f), f.join("/")).not.toContain("auth.getUser");
  });

  it("login menolak akun non-admin dan halaman login menampilkan pesannya", () => {
    expect(read("app", "admin", "actions.ts")).toContain("Akun ini tidak memiliki akses admin.");
    expect(read("app", "admin", "login", "page.tsx")).toContain('error !== "forbidden"');
  });
});

describe("Migrasi 0009_admin_role_policies.sql", () => {
  const sql = read("supabase", "migrations", "0009_admin_role_policies.sql");
  const code = sql.replace(/--.*$/gm, "");

  it("semua policy admin memakai public.is_admin(), bukan 'login saja'", () => {
    expect(code.match(/public\.is_admin\(\)/g)?.length).toBeGreaterThanOrEqual(12);
    expect(code).not.toMatch(/using \(true\)/);
    expect(code).not.toMatch(/auth\.uid\(\)\) is not null/);
  });

  it("mencakup guests, attendances, sessions, event_settings, registrations, dan approve_registration", () => {
    for (const name of [
      "admin write guests",
      "admin write attendances",
      "admin write sessions",
      "Admins can update event settings",
      "admin read registrations",
      "admin update registrations",
      "admin delete registrations",
    ]) {
      expect(code).toContain(`"${name}"`);
    }
    expect(code).toMatch(/create or replace function public\.approve_registration/);
    expect(code).toMatch(/if not \(select public\.is_admin\(\)\) then\s+raise exception 'Akses ditolak' using errcode = '42501'/);
  });
});
