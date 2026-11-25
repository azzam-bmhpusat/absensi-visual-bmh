import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  origin: "http://localhost:3000" as string | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(mocks.origin ? { origin: mocks.origin } : {}),
}));
// redirect() Next melempar; tiru agar alur berhenti dan tujuan bisa diperiksa.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));

import { GET } from "@/app/auth/callback/route";
import { updateSession } from "@/lib/supabase/middleware";
import { loginWithGoogle } from "@/app/(site)/login/actions";

function callback(query: string) {
  return GET(new NextRequest(`http://localhost:3000/auth/callback${query}`));
}

function form(next?: string) {
  const data = new FormData();
  if (next !== undefined) data.set("next", next);
  return data;
}

async function redirectOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return String((error as Error).message).replace(/^REDIRECT:/, "");
  }
  throw new Error("tidak redirect");
}

describe("/auth/callback (login Google)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: { email: "Staf@BMH.or.id" } }, error: null });
  });

  it("akun di luar @bmh.or.id ditolak: sesi dibuang -> /login?error=google_domain", async () => {
    for (const email of ["orang@gmail.com", "x@bmh.or.id.evil.com", "x@notbmh.or.id"]) {
      mocks.exchangeCodeForSession.mockResolvedValue({ data: { user: { email } }, error: null });
      const res = await callback("?code=abc&next=%2Fprofile");
      expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=google_domain");
    }
    expect(mocks.signOut).toHaveBeenCalledTimes(3);
  });

  it("menukar code lalu ke next yang aman", async () => {
    const res = await callback("?code=abc&next=%2Finformasi-kamar-hotel");
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(res.headers.get("location")).toBe("http://localhost:3000/informasi-kamar-hotel");
  });

  it("next berbahaya (open redirect) diganti /profile", async () => {
    for (const next of ["%2F%2Fevil.com", "https%3A%2F%2Fevil.com", "%2F%5Cevil.com"]) {
      const res = await callback(`?code=abc&next=${next}`);
      expect(res.headers.get("location")).toBe("http://localhost:3000/profile");
    }
  });

  it("tanpa code, dibatalkan, atau penukaran gagal -> /login?error=google", async () => {
    const noCode = await callback("");
    expect(noCode.headers.get("location")).toBe("http://localhost:3000/login?error=google");

    const cancelled = await callback("?error=access_denied&code=abc");
    expect(cancelled.headers.get("location")).toBe("http://localhost:3000/login?error=google");
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();

    mocks.exchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });
    const failed = await callback("?code=abc&next=%2Fpublikasi%2Fnotula-rapat");
    expect(failed.headers.get("location")).toBe(
      "http://localhost:3000/login?error=google&next=%2Fpublikasi%2Fnotula-rapat"
    );
  });
});

describe("middleware: code login Google yang mendarat di Site URL", () => {
  it("/?code= diteruskan ke /auth/callback (next bawaan /profile)", async () => {
    const res = await updateSession(new NextRequest("http://localhost:3000/?code=351b4227"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/auth/callback?code=351b4227");
  });

  it("halaman lain dengan ?code= dan beranda tanpa code tidak dialihkan", async () => {
    expect((await updateSession(new NextRequest("http://localhost:3000/"))).headers.get("location")).toBeNull();
    expect(
      (await updateSession(new NextRequest("http://localhost:3000/absen?code=abc"))).headers.get("location")
    ).toBeNull();
  });
});

describe("loginWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    mocks.origin = "http://localhost:3000";
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/o/oauth2/auth?x=1" }, error: null });
    providerSettings({ external: { google: true } });
  });

  /** Respons palsu /auth/v1/settings Supabase. */
  function providerSettings(body: unknown, ok = true) {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => body })));
  }

  it("provider Google belum aktif -> /login?error=google_disabled tanpa ke Supabase OAuth", async () => {
    providerSettings({ external: { google: false, email: true } });
    expect(await redirectOf(loginWithGoogle(form()))).toBe("/login?error=google_disabled");
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("status provider tidak bisa dibaca -> alur OAuth tetap jalan", async () => {
    providerSettings({}, false);
    expect(await redirectOf(loginWithGoogle(form()))).toBe("https://accounts.google.com/o/oauth2/auth?x=1");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    expect(await redirectOf(loginWithGoogle(form()))).toBe("https://accounts.google.com/o/oauth2/auth?x=1");
  });

  it("meminta provider google dengan redirectTo ke callback + next aman, lalu ke URL Google", async () => {
    const to = await redirectOf(loginWithGoogle(form("/informasi-kamar-hotel")));
    expect(to).toBe("https://accounts.google.com/o/oauth2/auth?x=1");
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Finformasi-kamar-hotel",
        queryParams: { hd: "bmh.or.id" },
      },
    });
  });

  it("tidak menambah scope (hanya bawaan: email & nama)", async () => {
    await redirectOf(loginWithGoogle(form()));
    expect(mocks.signInWithOAuth.mock.calls[0][0].options).not.toHaveProperty("scopes");
  });

  it("next berbahaya menjadi /profile; origin permintaan diutamakan dari NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rakernas.example/");
    await redirectOf(loginWithGoogle(form("//evil.com")));
    expect(mocks.signInWithOAuth.mock.calls[0][0].options.redirectTo).toBe(
      "http://localhost:3000/auth/callback?next=%2Fprofile"
    );
  });

  it("tanpa header origin memakai NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rakernas.example/");
    mocks.origin = null;
    await redirectOf(loginWithGoogle(form()));
    expect(mocks.signInWithOAuth.mock.calls[0][0].options.redirectTo).toBe(
      "https://rakernas.example/auth/callback?next=%2Fprofile"
    );
  });

  it("gagal memulai OAuth -> /login?error=google", async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { message: "provider disabled" } });
    expect(await redirectOf(loginWithGoogle(form()))).toBe("/login?error=google");
  });
});

describe("migrasi 0018", () => {
  const sql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/0018_google_login_user_role.sql"), "utf-8");

  it("role 'user' + nama_google hanya untuk provider google", () => {
    expect(sql).toMatch(/raw_app_meta_data\s*->>\s*'provider'\s*=\s*'google'/);
    expect(sql).toMatch(/insert into public\.profiles \(id, email, role, nama_google\)/);
    expect(sql).toMatch(/'user',/);
    // Cabang lain tetap memakai default kolom (peserta).
    expect(sql).toMatch(/insert into public\.profiles \(id, email\)\s+values \(new\.id, new\.email\)/);
  });

  it("nama_google tidak dibuka ke anon/authenticated dan nama tidak diisi", () => {
    expect(sql).not.toMatch(/grant select/i);
    expect(sql).not.toMatch(/\(id, email, role, nama[,)]/);
    expect(sql).toMatch(/revoke execute on function public\.handle_new_user\(\) from public, anon, authenticated/);
  });
});
