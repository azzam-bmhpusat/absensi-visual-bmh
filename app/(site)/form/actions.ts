"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { isoToWibLocal, participantFormSchema } from "@/lib/profile-contact";
import {
  FORM_ACCESS_COOKIE,
  createFormAccessToken,
  formAccessCookieOptions,
  isFormAccessPassword,
  verifyFormAccessToken,
} from "@/lib/form-access";
import type { ProfileInitial } from "@/components/profile/profile-form";

const NO_ACCESS = "Akses formulir berakhir. Muat ulang halaman lalu masukkan kata sandi akses.";
const UNLOCK_LIMIT = 10;
const SUBMIT_LIMIT = 30;
const WINDOW_MS = 15 * 60_000;

const FIELDS = [
  "nama",
  "perwakilan_daerah",
  "jabatan",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
] as const;

const idSchema = z.uuid();

async function clientIp(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
}

async function hasAccess(): Promise<boolean> {
  return verifyFormAccessToken((await cookies()).get(FORM_ACCESS_COOKIE)?.value);
}

export interface UnlockResult {
  success: boolean;
  error?: string;
}

/** Memeriksa kata sandi akses bersama lalu memberi cookie akses /form. */
export async function unlockForm(_prev: UnlockResult | null, formData: FormData): Promise<UnlockResult> {
  if (!checkRateLimit(`form-unlock:${await clientIp()}`, UNLOCK_LIMIT, WINDOW_MS)) {
    return { success: false, error: "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi." };
  }
  if (!isFormAccessPassword(formData.get("password")?.toString() ?? "")) {
    return { success: false, error: "Kata sandi akses salah." };
  }
  (await cookies()).set(FORM_ACCESS_COOKIE, createFormAccessToken(), formAccessCookieOptions());
  revalidatePath("/form");
  return { success: true };
}

export type LoadParticipantResult =
  | { success: true; initial: Omit<ProfileInitial, "email"> }
  | { success: false; error: string };

/** Data profil satu peserta untuk mengisi formulir. */
export async function loadParticipant(id: string): Promise<LoadParticipantResult> {
  if (!(await hasAccess())) return { success: false, error: NO_ACCESS };
  if (!idSchema.safeParse(id).success) return { success: false, error: "Peserta tidak ditemukan." };

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran")
    .eq("id", id)
    .eq("role", "peserta")
    .maybeSingle();
  if (error) return { success: false, error: "Gagal memuat data peserta. Coba lagi." };
  if (!data) return { success: false, error: "Peserta tidak ditemukan." };

  return {
    success: true,
    initial: {
      nama: data.nama ?? "",
      perwakilanDaerah: data.perwakilan_daerah ?? "",
      jabatan: data.jabatan ?? "",
      ukuranBaju: data.ukuran_baju ?? "",
      noWhatsapp: data.no_whatsapp ?? "",
      rencanaKedatangan: isoToWibLocal(data.rencana_kedatangan),
      keteranganKehadiran: data.keterangan_kehadiran ?? "",
    },
  };
}

export interface SubmitParticipantResult {
  success: boolean;
  error?: string;
  email?: string;
}

/** Menyimpan data profil peserta dari /form. Semua field wajib. */
export async function submitParticipantForm(
  _prev: SubmitParticipantResult | null,
  formData: FormData
): Promise<SubmitParticipantResult> {
  if (!(await hasAccess())) return { success: false, error: NO_ACCESS };
  if (!checkRateLimit(`form-submit:${await clientIp()}`, SUBMIT_LIMIT, WINDOW_MS)) {
    return { success: false, error: "Terlalu banyak pengiriman. Tunggu sebentar lalu coba lagi." };
  }

  const id = formData.get("id")?.toString() ?? "";
  if (!idSchema.safeParse(id).success) return { success: false, error: "Pilih nama peserta terlebih dahulu." };

  const raw = Object.fromEntries(FIELDS.map((f) => [f, formData.get(f)?.toString() ?? ""]));
  const parsed = participantFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .update(parsed.data)
      .eq("id", id)
      .eq("role", "peserta")
      .select("email")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Peserta dengan nama dan perwakilan daerah ini sudah terdaftar." };
      }
      return { success: false, error: "Gagal menyimpan: " + error.message };
    }
    if (!data?.email) return { success: false, error: "Peserta tidak ditemukan." };
    return { success: true, email: data.email };
  } catch (err) {
    console.error("Error submitParticipantForm:", err);
    return { success: false, error: "Terjadi kesalahan saat mengirim data." };
  }
}
