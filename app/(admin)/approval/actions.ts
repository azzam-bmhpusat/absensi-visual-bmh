"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { createParticipantAccount, getParticipantPassword } from "@/lib/participant-account";

export interface RegistrationActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const idSchema = z.string().uuid("ID pendaftaran tidak valid");

function revalidateAll() {
  revalidatePath("/approval");
  revalidatePath("/guest");
  revalidatePath("/admin");
  revalidatePath("/absen");
  revalidatePath("/display");
}

async function requireAdmin() {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  return user ? supabase : null;
}

const DENIED: RegistrationActionResult = {
  success: false,
  error: "Akses ditolak. Anda harus login sebagai admin.",
};

const normalize = (v: string) => v.trim().toLowerCase();

/**
 * Menyetujui pendaftaran: peserta dibuat sebagai akun Auth + profil (role user), atau — bila orang yang sama
 * (nama + perwakilan) sudah terdaftar — profilnya dilengkapi. Lalu pendaftaran ditandai disetujui.
 */
export async function approveRegistrationAction(
  id: string
): Promise<RegistrationActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await requireAdmin();
  if (!supabase) return DENIED;

  const db = createAdminClient();
  const { data: reg, error: regError } = await db
    .from("registrations")
    .select("id, nama, perwakilan_bmh, jabatan, departemen, ukuran_baju, mode_kehadiran, status, guest_id")
    .eq("id", parsed.data)
    .maybeSingle();
  if (regError || !reg) {
    if (regError) console.error("approveRegistrationAction baca gagal:", regError.code, regError.message);
    return { success: false, error: "Pendaftaran tidak ditemukan." };
  }
  if (reg.status === "approved" && reg.guest_id) {
    revalidateAll();
    return { success: true, message: "Pendaftaran sudah disetujui sebelumnya." };
  }

  // Orang yang sama sudah ada? (setara on conflict pada indeks unik nama + perwakilan)
  const { data: participants, error: listError } = await db
    .from("profiles")
    .select("id, nama, perwakilan_daerah, jabatan, departemen")
    .not("nama", "is", null);
  if (listError) {
    console.error("approveRegistrationAction daftar peserta gagal:", listError.code, listError.message);
    return { success: false, error: "Gagal menyetujui pendaftaran." };
  }
  const existing = (participants ?? []).find(
    (p) => normalize(p.nama ?? "") === normalize(reg.nama) && normalize(p.perwakilan_daerah ?? "") === normalize(reg.perwakilan_bmh)
  );

  let participantId: string;
  let createdNow = false;
  if (existing) {
    const { error } = await db
      .from("profiles")
      .update({
        ukuran_baju: reg.ukuran_baju,
        mode_kehadiran: reg.mode_kehadiran,
        jabatan: existing.jabatan ?? reg.jabatan,
        departemen: existing.departemen ?? reg.departemen,
      })
      .eq("id", existing.id);
    if (error) {
      console.error("approveRegistrationAction update gagal:", error.code, error.message);
      return { success: false, error: "Gagal menyetujui pendaftaran." };
    }
    participantId = existing.id;
  } else {
    const created = await createParticipantAccount(db, {
      password: getParticipantPassword(),
      fields: {
        nama: reg.nama,
        perwakilan_daerah: reg.perwakilan_bmh,
        jabatan: reg.jabatan,
        departemen: reg.departemen,
        kategori: "daerah",
        ukuran_baju: reg.ukuran_baju,
        mode_kehadiran: reg.mode_kehadiran,
      },
    });
    if (!created.ok) {
      console.error("approveRegistrationAction buat akun gagal:", created.code, created.error);
      return {
        success: false,
        error:
          created.code === "duplicate_person"
            ? "Ada pendaftaran lain dengan nama dan perwakilan yang sama."
            : "Gagal membuat akun peserta.",
      };
    }
    participantId = created.id;
    createdNow = true;
  }

  const { error: markError } = await db
    .from("registrations")
    .update({ status: "approved", guest_id: participantId, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data);
  if (markError) {
    console.error("approveRegistrationAction tandai gagal:", markError.code, markError.message);
    // Jangan tinggalkan akun baru tanpa pendaftaran yang disetujui.
    if (createdNow) await db.auth.admin.deleteUser(participantId);
    return { success: false, error: "Gagal menyetujui pendaftaran." };
  }

  revalidateAll();
  return { success: true, message: "Pendaftaran disetujui dan akun peserta dibuat." };
}

export async function rejectRegistrationAction(
  id: string
): Promise<RegistrationActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await requireAdmin();
  if (!supabase) return DENIED;

  const { data, error } = await supabase
    .from("registrations")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("rejectRegistrationAction gagal:", error.code, error.message);
    return { success: false, error: "Gagal menolak pendaftaran." };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Hanya pendaftaran berstatus menunggu yang bisa ditolak." };
  }

  revalidateAll();
  return { success: true, message: "Pendaftaran ditolak." };
}

export async function deleteRegistrationAction(
  id: string
): Promise<RegistrationActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await requireAdmin();
  if (!supabase) return DENIED;

  const { error } = await supabase.from("registrations").delete().eq("id", parsed.data);
  if (error) {
    console.error("deleteRegistrationAction gagal:", error.code, error.message);
    return { success: false, error: "Gagal menghapus pendaftaran." };
  }

  revalidateAll();
  return { success: true, message: "Pendaftaran dihapus." };
}
