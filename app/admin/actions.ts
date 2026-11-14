"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guestRowSchema, type GuestRowInput } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
 * Menyimpan batch daftar tamu undangan yang sudah divalidasi
 */
export async function importGuestsAction(
  rows: GuestRowInput[]
): Promise<ActionResult<{ insertedCount: number }>> {
  if (!rows || rows.length === 0) {
    return {
      success: false,
      error: "Tidak ada data tamu yang valid untuk diimpor.",
    };
  }

  // Verifikasi otorisasi admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  // Validasi ulang setiap baris di sisi server
  const sanitizedRows: GuestRowInput[] = [];
  for (const row of rows) {
    const parse = guestRowSchema.safeParse(row);
    if (parse.success) {
      sanitizedRows.push(parse.data);
    }
  }

  if (sanitizedRows.length === 0) {
    return {
      success: false,
      error: "Semua baris tidak memenuhi format validasi nama dan daerah.",
    };
  }

  try {
    // Gunakan admin client untuk eksekusi batch yang andal
    const admin = createAdminClient();

    // Insert batch dengan ignore duplicates (on conflict do nothing)
    const { data, error } = await admin
      .from("guests")
      .upsert(sanitizedRows, {
        onConflict: "lower(trim(nama)),lower(trim(perwakilan_daerah))",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      // Fallback: jika DB belum mendukung sintaks ekspresi upsert langsung dari SDK,
      // kita insert satu per satu atau insert batch biasa
      const { data: inserted, error: insertError } = await admin
        .from("guests")
        .insert(sanitizedRows)
        .select("id");

      if (insertError) {
        console.error("Gagal import batch tamu:", insertError);
        return {
          success: false,
          error: "Gagal menyimpan daftar tamu: " + insertError.message,
        };
      }

      revalidatePath("/admin");
      revalidatePath("/absen");
      revalidatePath("/display");

      return {
        success: true,
        data: { insertedCount: inserted?.length || sanitizedRows.length },
      };
    }

    revalidatePath("/admin");
    revalidatePath("/absen");
    revalidatePath("/display");

    return {
      success: true,
      data: { insertedCount: data?.length || sanitizedRows.length },
    };
  } catch (err) {
    console.error("Error importGuestsAction:", err);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat memproses impor data tamu.",
    };
  }
}

/**
 * Menghapus data tamu dari daftar undangan
 */
export async function deleteGuestAction(
  guestId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Akses ditolak. Anda harus login sebagai admin.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("guests").delete().eq("id", guestId);

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
 * Menambahkan 1 tamu baru secara manual dari form admin
 */
export async function addGuestAction(
  data: GuestRowInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    const { data: inserted, error } = await admin
      .from("guests")
      .insert({
        nama: parse.data.nama,
        perwakilan_daerah: parse.data.perwakilan_daerah,
        jabatan: parse.data.jabatan || null,
        departemen: parse.data.departemen || null,
        kategori: parse.data.kategori || "daerah",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "Tamu dengan nama dan daerah ini sudah terdaftar.",
        };
      }
      return {
        success: false,
        error: "Gagal menambahkan tamu: " + error.message,
      };
    }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      .from("guests")
      .update({
        nama: parse.data.nama,
        perwakilan_daerah: parse.data.perwakilan_daerah,
        jabatan: parse.data.jabatan || null,
        departemen: parse.data.departemen || null,
        kategori: parse.data.kategori || "daerah",
      })
      .eq("id", guestId);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
