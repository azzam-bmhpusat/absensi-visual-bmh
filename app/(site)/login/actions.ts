"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/profile-contact";

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

/** Keluar dari sesi lalu kembali ke halaman login. */
export async function logoutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
