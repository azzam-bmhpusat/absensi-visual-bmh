"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser, checkAdmin } from "@/lib/auth/admin";
import { guestRowSchema, type GuestRowInput } from "@/lib/schemas";
import { createParticipantAccount, getParticipantPassword } from "@/lib/participant-account";
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
 * Menghapus peserta dari daftar. Peserta adalah akun Supabase Auth + profil, jadi akunnya ikut dihapus
 * (profil terhapus lewat on delete cascade; riwayat kehadiran tetap, guest_id menjadi null).
 * Akun admin tidak bisa dihapus dari sini — gunakan Manajemen User.
 */
export async function deleteGuestAction(
  guestId: string
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
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", guestId)
      .not("nama", "is", null)
      .maybeSingle();
    if (!profile) return { success: false, error: "Peserta tidak ditemukan." };
    if (profile.role === "admin") {
      return { success: false, error: "Akun admin tidak dapat dihapus dari daftar peserta. Gunakan Manajemen User." };
    }
    if (profile.id === user.id) return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." };

    const { error } = await admin.auth.admin.deleteUser(guestId);

    if (error) {
      return {
        success: false,
        error: "Gagal menghapus tamu: " + error.message,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/absen");
    revalidatePath("/display");

    return { success: true };
  } catch (err) {
    console.error("Error deleteGuestAction:", err);
    return { success: false, error: "Gagal menghapus data tamu." };
  }
}

/**
 * Menambahkan 1 peserta baru dari form admin: dibuat akun Auth (email dari nama depan + @bmh.or.id,
 * password default, role user) beserta profil pesertanya.
 */
export async function addGuestAction(
  data: GuestRowInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  const parse = guestRowSchema.safeParse(data);
  if (!parse.success) {
    return {
      success: false,
      error: "Format input nama atau perwakilan daerah tidak valid.",
    };
  }

  try {
    const admin = createAdminClient();
    const created = await createParticipantAccount(admin, {
      password: getParticipantPassword(),
      fields: {
        nama: parse.data.nama,
        perwakilan_daerah: parse.data.perwakilan_daerah,
        jabatan: parse.data.jabatan || null,
        departemen: parse.data.departemen || null,
        kategori: parse.data.kategori || "daerah",
      },
    });

    if (!created.ok) {
      if (created.code === "duplicate_person") {
        return {
          success: false,
          error: "Tamu dengan nama dan daerah ini sudah terdaftar.",
        };
      }
      return {
        success: false,
        error: "Gagal menambahkan tamu: " + created.error,
      };
    }
    const inserted = { id: created.id };

    revalidatePath("/admin");
    revalidatePath("/absen");
    revalidatePath("/display");

    return {
      success: true,
      message: "Tamu berhasil ditambahkan.",
      data: { id: inserted?.id || "" },
    };
  } catch (err) {
    console.error("Error addGuestAction:", err);
    return { success: false, error: "Terjadi kesalahan saat menambahkan tamu." };
  }
}

/**
 * Memperbarui data tamu (nama / perwakilan daerah)
 */
export async function updateGuestAction(
  guestId: string,
  data: GuestRowInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  const parse = guestRowSchema.safeParse(data);
  if (!parse.success) {
    return {
      success: false,
      error: "Format input nama atau perwakilan daerah tidak valid.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        nama: parse.data.nama,
        perwakilan_daerah: parse.data.perwakilan_daerah,
        jabatan: parse.data.jabatan || null,
        departemen: parse.data.departemen || null,
        kategori: parse.data.kategori || "daerah",
      })
      .eq("id", guestId)
      .not("nama", "is", null);

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "Tamu lain dengan nama dan daerah ini sudah terdaftar.",
        };
      }
      return {
        success: false,
        error: "Gagal memperbarui tamu: " + error.message,
      };
    }

    revalidatePath("/admin");
    revalidatePath("/absen");
    revalidatePath("/display");

    return { success: true, message: "Data tamu berhasil diperbarui." };
  } catch (err) {
    console.error("Error updateGuestAction:", err);
    return { success: false, error: "Gagal memperbarui data tamu." };
  }
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
