"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BMH_EMAIL_DOMAIN, safeNextPath } from "@/lib/profile-contact";

export interface LoginResult {
  success: boolean;
  error?: string;
  next?: string;
}

/** Login semua user (peserta maupun admin) dengan email + kata sandi. */
export async function loginUser(_prev: LoginResult | null, formData: FormData): Promise<LoginResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  if (!email || !password) {
    return { success: false, error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: "Email atau kata sandi tidak sesuai. Silakan periksa kembali." };
  }
  return { success: true, next: safeNextPath(formData.get("next")?.toString()) };
}

/**
 * Mulai login dengan Google (OAuth, PKCE). Google hanya diminta scope bawaan Supabase
 * (openid email profile) untuk email dan nama. Akun baru mendapat role `user` lewat trigger
 * database (migrasi 0018). Setelah Google, Supabase mengarahkan ke /auth/callback.
 */
export async function loginWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get("next")?.toString());
  // Origin permintaan diutamakan (Next sudah mencocokkannya dengan Host untuk server action), agar
  // login dari localhost kembali ke localhost: cookie PKCE ada di domain yang memulai login.
  // Supabase tetap menolak redirectTo di luar daftar Redirect URLs.
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!origin) redirect("/login?error=google");
  // Provider mati -> Supabase menampilkan JSON mentah ("provider is not enabled"); tangani di sini.
  if ((await isGoogleProviderEnabled()) === false) redirect("/login?error=google_disabled");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      // Petunjuk ke Google agar hanya menampilkan akun domain BMH; penegakan ada di /auth/callback.
      queryParams: { hd: BMH_EMAIL_DOMAIN },
    },
  });
  if (error || !data.url) {
    console.error("Gagal memulai login Google:", error?.message);
    redirect("/login?error=google");
  }
  redirect(data.url);
}

/**
 * Status provider Google dari endpoint publik Supabase Auth (/auth/v1/settings).
 * `null` bila tidak bisa dipastikan: alur OAuth tetap dilanjutkan (Supabase yang memutuskan).
 */
async function isGoogleProviderEnabled(): Promise<boolean | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const settings = (await res.json()) as { external?: { google?: unknown } };
    return typeof settings.external?.google === "boolean" ? settings.external.google : null;
  } catch {
    return null;
  }
}

/** Keluar dari sesi lalu kembali ke halaman login. */
export async function logoutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
