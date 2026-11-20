"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

const DENIED: RegistrationActionResult = {
  success: false,
  error: "Akses ditolak. Anda harus login sebagai admin.",
};

export async function approveRegistrationAction(
  id: string
): Promise<RegistrationActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await requireAdmin();
  if (!supabase) return DENIED;

  // Fungsi SQL menyalin ke guests + menandai approved dalam satu transaksi
  const { error } = await supabase.rpc("approve_registration", { p_id: parsed.data });
  if (error) {
    console.error("approveRegistrationAction gagal:", error.code, error.message);
    return {
      success: false,
      error:
        error.code === "23505"
          ? "Ada pendaftaran lain dengan nama dan perwakilan yang sama."
          : "Gagal menyetujui pendaftaran.",
    };
  }

  revalidateAll();
  return { success: true, message: "Pendaftaran disetujui dan masuk ke daftar tamu." };
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
