"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  PROFILE_COMPLETE_COLUMNS,
  isProfileComplete,
  isoToWibLocal,
  participantFormSchema,
} from "@/lib/profile-contact";
import type { ProfileInitial } from "@/components/profile/profile-form";

const LOAD_LIMIT = 60;
const SUBMIT_LIMIT = 30;
const WINDOW_MS = 15 * 60_000;

/** Field yang boleh diisi lewat /form (email, nama, dan perwakilan daerah dikunci, tidak dibaca dari form). */
const FIELDS = [
  "jabatan",
  "ukuran_baju",
  "no_whatsapp",
  "rencana_kedatangan",
  "keterangan_kehadiran",
] as const;

const idSchema = z.uuid();

/** Role yang boleh mengisi data lewat formulir publik (/form: peserta, /form-data-direksi: direktur). */
export type FormRole = "peserta" | "direktur";
const roleSchema = z.enum(["peserta", "direktur"]);

/** Profil yang sudah lengkap dikunci dari /form; perubahan lewat halaman Profil setelah login. */
const ALREADY_FILLED = "Data peserta ini sudah diisi lengkap. Untuk mengubahnya, masuk lalu buka halaman Profil.";

/** Satu profil peserta (role peserta) beserta kolom kelengkapannya. */
async function readParticipant(id: string, role: FormRole) {
  return createAdminClient()
    .from("profiles")
    .select(`email, ${PROFILE_COMPLETE_COLUMNS}`)
    .eq("id", id)
    .eq("role", role)
    .maybeSingle();
}

async function clientIp(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
}

export type LoadParticipantResult =
  | { success: true; initial: ProfileInitial }
  | { success: false; error: string };

/** Data profil satu peserta untuk mengisi formulir. */
export async function loadParticipant(id: string, role: FormRole): Promise<LoadParticipantResult> {
  if (!checkRateLimit(`form-load:${await clientIp()}`, LOAD_LIMIT, WINDOW_MS)) {
    return { success: false, error: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi." };
  }
  if (!idSchema.safeParse(id).success || !roleSchema.safeParse(role).success) {
    return { success: false, error: "Peserta tidak ditemukan." };
  }

  const { data, error } = await readParticipant(id, role);
  if (error) return { success: false, error: "Gagal memuat data peserta. Coba lagi." };
  if (!data) return { success: false, error: "Peserta tidak ditemukan." };
  if (isProfileComplete(data)) return { success: false, error: ALREADY_FILLED };

  return {
    success: true,
    initial: {
      email: data.email ?? "",
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
  if (!checkRateLimit(`form-submit:${await clientIp()}`, SUBMIT_LIMIT, WINDOW_MS)) {
    return { success: false, error: "Terlalu banyak pengiriman. Tunggu sebentar lalu coba lagi." };
  }

  const id = formData.get("id")?.toString() ?? "";
  if (!idSchema.safeParse(id).success) return { success: false, error: "Pilih nama peserta terlebih dahulu." };
  const roleParsed = roleSchema.safeParse(formData.get("role")?.toString());
  if (!roleParsed.success) return { success: false, error: "Formulir tidak valid." };
  const role = roleParsed.data;

  const raw = Object.fromEntries(FIELDS.map((f) => [f, formData.get(f)?.toString() ?? ""]));
  const parsed = participantFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    // Tolak juga di server: daftar di browser bisa saja sudah usang atau dilewati.
    const current = await readParticipant(id, role);
    if (current.error) return { success: false, error: "Gagal memeriksa data peserta. Coba lagi." };
    if (!current.data) return { success: false, error: "Peserta tidak ditemukan." };
    if (isProfileComplete(current.data)) return { success: false, error: ALREADY_FILLED };

    const { data, error } = await createAdminClient()
      .from("profiles")
      .update(parsed.data)
      .eq("id", id)
      .eq("role", role)
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
