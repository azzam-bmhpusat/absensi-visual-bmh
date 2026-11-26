"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin";
import { verifyUserQrToken } from "@/lib/absen-token";

export type ScanResult =
  | { status: "ok"; nama: string; daerah: string; sesi: string }
  | { status: "already"; nama: string; daerah: string; sesi: string }
  | { status: "error"; message: string };

/** Admin men-scan QR pribadi user lalu mencatat kehadirannya di sesi terpilih. */
export async function recordScan(token: string, sessionId: number): Promise<ScanResult> {
  const { isAdmin } = await checkAdmin(await createClient());
  if (!isAdmin) return { status: "error", message: "Hanya admin yang dapat mencatat absensi." };

  const profileId = verifyUserQrToken(token);
  if (!profileId) return { status: "error", message: "QR tidak valid atau bukan QR absensi BMH." };
  if (!Number.isInteger(sessionId)) return { status: "error", message: "Pilih sesi terlebih dahulu." };

  const db = createAdminClient();
  const [{ data: profile }, { data: session }] = await Promise.all([
    db
      .from("profiles")
      .select("id, nama, nama_google, email, perwakilan_daerah, jabatan, kategori")
      .eq("id", profileId)
      .maybeSingle(),
    db.from("sessions").select("id, nama, is_active").eq("id", sessionId).maybeSingle(),
  ]);

  if (!profile) return { status: "error", message: "User untuk QR ini tidak ditemukan." };
  if (!session) return { status: "error", message: "Sesi tidak ditemukan." };
  if (!session.is_active) return { status: "error", message: `Sesi ${session.nama} sedang ditutup.` };

  const nama = profile.nama?.trim() || profile.nama_google?.trim() || profile.email || "Tanpa nama";
  const daerah = profile.perwakilan_daerah?.trim() || "-";
  const info = { nama, daerah, sesi: session.nama as string };

  const { error } = await db.from("attendances").insert({
    session_id: sessionId,
    guest_id: profile.id,
    nama,
    perwakilan_daerah: daerah,
    jabatan: profile.jabatan ?? null,
    kategori: profile.kategori ?? "daerah",
    is_walk_in: false,
  });

  if (error) {
    if (error.code === "23505") return { status: "already", ...info };
    return { status: "error", message: "Gagal menyimpan absensi. Coba lagi." };
  }
  return { status: "ok", ...info };
}
