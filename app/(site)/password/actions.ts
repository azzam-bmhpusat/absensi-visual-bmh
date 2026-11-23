"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PASSWORD_CHANGED_AT, changePasswordSchema } from "@/lib/password-policy";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60_000;

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  field?: "current" | "next" | "confirm";
}

/** Cek kata sandi lama dengan klien terpisah tanpa cookie, sehingga sesi pengguna tidak tersentuh. */
async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  const probe = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  if (error) return false;
  // Cabut sesi sementara hasil verifikasi agar tidak ada refresh token yang menggantung.
  await probe.auth.signOut({ scope: "local" });
  return true;
}

/**
 * Mengganti kata sandi akun yang sedang login.
 * - Identitas dari sesi (getUser), bukan dari input.
 * - Kata sandi lama diverifikasi ulang; kata sandi baru cukup minimal 6 karakter (dicek di server).
 * - Ditandai di app_metadata (hanya service role) lalu sesi di perangkat lain dicabut.
 */
export async function changePassword(
  _prev: ChangePasswordResult | null,
  formData: FormData
): Promise<ChangePasswordResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const parsed = changePasswordSchema.safeParse({
    current: formData.get("current")?.toString() ?? "",
    next: formData.get("next")?.toString() ?? "",
    confirm: formData.get("confirm")?.toString() ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message ?? "Data tidak valid.",
      field: issue?.path[0] as ChangePasswordResult["field"],
    };
  }
  const { current, next } = parsed.data;

  // Batasi tebakan kata sandi lama per akun (in-memory per instance; Supabase Auth juga membatasi login).
  if (!checkRateLimit(`change-password:${user.id}`, MAX_ATTEMPTS, ATTEMPT_WINDOW_MS)) {
    return { success: false, error: "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi." };
  }

  if (!(await verifyCurrentPassword(user.email, current))) {
    return { success: false, error: "Kata sandi saat ini salah.", field: "current" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: next,
    app_metadata: { [PASSWORD_CHANGED_AT]: new Date().toISOString() },
  });
  if (error) {
    console.error("changePassword gagal:", error.code, error.message);
    if (error.code === "weak_password") {
      return { success: false, error: "Kata sandi baru terlalu lemah.", field: "next" };
    }
    if (error.code === "same_password") {
      return { success: false, error: "Kata sandi baru harus berbeda dari yang lama.", field: "next" };
    }
    return { success: false, error: "Gagal mengganti kata sandi. Coba lagi." };
  }

  // Keluarkan sesi lain (mis. perangkat yang memakai kata sandi lama); sesi ini tetap aktif.
  await supabase.auth.signOut({ scope: "others" });
  revalidatePath("/", "layout");
  return { success: true };
}
