"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser, checkAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DELETE_ALL_CONFIRM_PHRASE } from "@/lib/attendance-export";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Autentikasi login admin panitia dengan Supabase Auth
 */
export async function loginAdmin(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan kata sandi wajib diisi.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Email atau kata sandi tidak sesuai. Silakan periksa kembali.",
    };
  }

  // Akun valid tetapi bukan admin (role 'user'): akhiri sesi dan tolak.
  const { isAdmin } = await checkAdmin(supabase);
  if (!isAdmin) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Akun ini tidak memiliki akses admin.",
    };
  }

  return { success: true };
}

/**
 * Keluar dari sesi admin dan redirect ke halaman login
 */
export async function logoutAdmin(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Menghapus catatan absensi (FR-18)
 */
export async function deleteAttendanceAction(
  attendanceId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("attendances")
      .delete()
      .eq("id", attendanceId);

    if (error) {
      return {
        success: false,
        error: "Gagal menghapus catatan kehadiran: " + error.message,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/display");

    return { success: true };
  } catch (err) {
    console.error("Error deleteAttendanceAction:", err);
    return { success: false, error: "Gagal menghapus catatan kehadiran." };
  }
}

/**
 * Mengubah status buka / tutup (aktif / nonaktif) sesi presensi
 */
export async function toggleSessionStatusAction(
  sessionId: number,
  isActive: boolean
): Promise<ActionResult<{ id: number; is_active: boolean }>> {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("sessions")
      .update({ is_active: isActive })
      .eq("id", sessionId);

    if (error) {
      return {
        success: false,
        error: "Gagal memperbarui status sesi: " + error.message,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/absen");
    revalidatePath("/display");

    return {
      success: true,
      message: `Sesi berhasil ${isActive ? "dibuka" : "ditutup"}.`,
      data: { id: sessionId, is_active: isActive },
    };
  } catch (err) {
    console.error("Error toggleSessionStatusAction:", err);
    return { success: false, error: "Gagal memperbarui status sesi." };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Hapus massal data kehadiran (menubar rekap kehadiran)
// ─────────────────────────────────────────────────────────────────────

// Frasa konfirmasi didefinisikan di lib (file "use server" hanya boleh ekspor fungsi async).

const sessionIdSchema = z.coerce.number().int().positive().max(32767);

async function requireAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  return Boolean(await getAdminUser(supabase));
}

function revalidateAttendanceViews() {
  revalidatePath("/rekap-kehadiran");
  revalidatePath("/dashboard");
  revalidatePath("/display");
  revalidatePath("/absen");
  revalidatePath("/admin");
}

export interface AttendanceCountResult {
  total: number;
  perSession: { session_id: number; count: number }[];
}

/**
 * Menghitung jumlah baris kehadiran (akurat dari server) untuk dialog konfirmasi hapus.
 */
export async function countAttendancesAction(
  target: number | "all"
): Promise<ActionResult<AttendanceCountResult>> {
  if (!(await requireAdminUser())) {
    return { success: false, error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  try {
    const admin = createAdminClient();
    let sessionIds: number[];
    if (target === "all") {
      const { data, error } = await admin.from("sessions").select("id").order("id");
      if (error) throw error;
      sessionIds = (data ?? []).map((s) => s.id as number);
    } else {
      const parsed = sessionIdSchema.safeParse(target);
      if (!parsed.success) return { success: false, error: "Sesi tidak valid." };
      sessionIds = [parsed.data];
    }

    const perSession = await Promise.all(
      sessionIds.map(async (session_id) => {
        const { count, error } = await admin
          .from("attendances")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session_id);
        if (error) throw error;
        return { session_id, count: count ?? 0 };
      })
    );

    return {
      success: true,
      data: { total: perSession.reduce((n, s) => n + s.count, 0), perSession },
    };
  } catch (err) {
    console.error("Error countAttendancesAction:", err);
    return { success: false, error: "Gagal menghitung data kehadiran." };
  }
}

/**
 * Menghapus SEMUA catatan kehadiran pada satu sesi.
 */
export async function deleteSessionAttendancesAction(
  sessionId: number
): Promise<ActionResult<{ deletedCount: number }>> {
  if (!(await requireAdminUser())) {
    return { success: false, error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  const parsed = sessionIdSchema.safeParse(sessionId);
  if (!parsed.success) return { success: false, error: "Sesi tidak valid." };

  try {
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select("id")
      .eq("id", parsed.data)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return { success: false, error: "Sesi tidak ditemukan." };

    const { count, error } = await admin
      .from("attendances")
      .delete({ count: "exact" })
      .eq("session_id", parsed.data);

    if (error) {
      return { success: false, error: "Gagal menghapus data kehadiran sesi: " + error.message };
    }

    revalidateAttendanceViews();
    return { success: true, data: { deletedCount: count ?? 0 } };
  } catch (err) {
    console.error("Error deleteSessionAttendancesAction:", err);
    return { success: false, error: "Gagal menghapus data kehadiran sesi." };
  }
}

/**
 * Menghapus SEMUA catatan kehadiran di semua sesi. Wajib frasa konfirmasi.
 */
export async function deleteAllAttendancesAction(
  confirmText: string
): Promise<ActionResult<{ deletedCount: number }>> {
  if (!(await requireAdminUser())) {
    return { success: false, error: "Akses ditolak. Anda harus login sebagai admin." };
  }

  if (typeof confirmText !== "string" || confirmText.trim() !== DELETE_ALL_CONFIRM_PHRASE) {
    return {
      success: false,
      error: `Ketik "${DELETE_ALL_CONFIRM_PHRASE}" untuk mengonfirmasi penghapusan.`,
    };
  }

  try {
    const admin = createAdminClient();
    // Supabase mewajibkan filter pada DELETE; session_id selalu >= 1.
    const { count, error } = await admin
      .from("attendances")
      .delete({ count: "exact" })
      .gte("session_id", 0);

    if (error) {
      return { success: false, error: "Gagal menghapus semua data kehadiran: " + error.message };
    }

    revalidateAttendanceViews();
    return { success: true, data: { deletedCount: count ?? 0 } };
  } catch (err) {
    console.error("Error deleteAllAttendancesAction:", err);
    return { success: false, error: "Gagal menghapus semua data kehadiran." };
  }
}
