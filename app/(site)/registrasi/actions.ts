"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { registrationSchema, type RegistrationInput } from "@/lib/registration-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export type SubmitRegistrationResponse =
  | { status: "ok" }
  | { status: "duplicate"; message: string }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string[]> };

export async function submitRegistration(
  data: RegistrationInput
): Promise<SubmitRegistrationResponse> {
  // 1. Honeypot: jika terisi, balas sukses palsu tanpa menyimpan apa pun
  if (data?.website && data.website.trim().length > 0) {
    return { status: "ok" };
  }

  // 2. Validasi ulang di server (jangan percaya validasi klien)
  const parsed = registrationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 3. Rate limiting per IP
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  if (!checkRateLimit(`registrasi:${ip}`, 5)) {
    return {
      status: "error",
      message: "Terlalu banyak percobaan, coba sebentar lagi.",
    };
  }

  // 4. Simpan lewat service role (tabel tidak bisa ditulis anon)
  const { nama, perwakilan_bmh, jabatan, departemen, ukuran_baju, mode_kehadiran } =
    parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("registrations").insert({
    nama,
    perwakilan_bmh,
    jabatan,
    departemen: departemen ?? null,
    ukuran_baju,
    mode_kehadiran,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "duplicate",
        message:
          "Data Anda sudah terdaftar. Silakan hubungi panitia jika ada kekeliruan.",
      };
    }
    console.error("submitRegistration gagal:", error.code, error.message);
    return {
      status: "error",
      message: "Terjadi kesalahan saat menyimpan pendaftaran. Silakan coba lagi.",
    };
  }

  revalidatePath("/approval");
  return { status: "ok" };
}
