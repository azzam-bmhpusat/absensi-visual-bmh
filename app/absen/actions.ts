"use server";

import { cookies, headers } from "next/headers";
import { attendanceSchema, type AttendanceInput } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeCompare, normalizeString } from "@/lib/normalize";
import {
  DEVICE_COOKIE,
  TICKET_COOKIE,
  hashDeviceId,
  isValidDeviceId,
  verifyTicket,
} from "@/lib/absen-token";

const SCAN_AGAIN_MESSAGE =
  "Waktu scan sudah habis atau QR sudah dipakai. Silakan scan ulang QR yang tampil di layar lokasi acara.";

export type SubmitAttendanceResponse =
  | { status: "ok"; nama: string; sesi: string }
  | { status: "already"; message: string }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string[]> };

function getSessionLabel(sessionId: number): string {
  const hariNames = ["Hari Pertama", "Hari Kedua", "Hari Ketiga"];
  const sesiNames = [
    "Absen Masuk Pagi",
    "Masuk Setelah Isoma",
    "Masuk Setelah Makan Malam",
  ];
  const hariIdx = Math.floor((sessionId - 1) / 3);
  const sesiIdx = (sessionId - 1) % 3;
  if (hariIdx >= 0 && hariIdx < 3 && sesiIdx >= 0 && sesiIdx < 3) {
    return `${hariNames[hariIdx]} - ${sesiNames[sesiIdx]}`;
  }
  return `Sesi ${sessionId}`;
}

export async function submitAttendance(
  data: AttendanceInput
): Promise<SubmitAttendanceResponse> {
  // 1. Honeypot check: jika terisi, kembalikan {status: 'ok'} palsu
  if (data.website && data.website.trim().length > 0) {
    return {
      status: "ok",
      nama: data.nama ? normalizeString(data.nama) : "",
      sesi: getSessionLabel(data.sessionId),
    };
  }

  // 2. Validasi dengan zod
  const parsed = attendanceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 3. Rate limiting per IP (10/menit)
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return {
      status: "error",
      message: "Terlalu banyak percobaan, coba sebentar lagi.",
    };
  }

  // 3b. Wajib tiket scan QR yang valid + ID perangkat (anti share link & titip absen)
  const cookieStore = await cookies();
  const ticket = verifyTicket(cookieStore.get(TICKET_COOKIE)?.value);
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;
  if (!ticket || !isValidDeviceId(deviceId)) {
    return { status: "error", message: SCAN_AGAIN_MESSAGE };
  }
  const deviceHash = hashDeviceId(deviceId);

  const { sessionId, nama, perwakilanDaerah } = parsed.data;
  let guestId: string | null = parsed.data.guestId ?? null;
  let finalNama = nama;
  let finalDaerah = perwakilanDaerah;
  let finalJabatan: string | null = parsed.data.jabatan ?? null;
  let finalDepartemen: string | null = parsed.data.departemen ?? null;
  let finalKategori: string = parsed.data.kategori ?? "daerah";
  let isWalkIn = false;

  const supabase = createAdminClient();

  // 4. Tentukan tamu (guestId atau exact match)
  if (guestId) {
    const { data: guest } = await supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah, jabatan, departemen, kategori")
      .eq("id", guestId)
      .maybeSingle();

    if (guest) {
      finalNama = guest.nama;
      finalDaerah = guest.perwakilan_daerah;
      finalJabatan = guest.jabatan ?? finalJabatan;
      finalDepartemen = guest.departemen ?? finalDepartemen;
      finalKategori = guest.kategori ?? finalKategori;
    } else {
      guestId = null;
    }
  }

  if (!guestId) {
    // Cari kecocokan persis lower(trim(nama)) + lower(trim(daerah))
    const normNama = normalizeCompare(nama);
    const normDaerah = normalizeCompare(perwakilanDaerah);

    const { data: matchedGuests } = await supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah, jabatan, departemen, kategori");

    const matched = (matchedGuests || []).find(
      (g) =>
        normalizeCompare(g.nama) === normNama &&
        normalizeCompare(g.perwakilan_daerah) === normDaerah
    );

    if (matched) {
      guestId = matched.id;
      finalNama = matched.nama;
      finalDaerah = matched.perwakilan_daerah;
      finalJabatan = matched.jabatan ?? finalJabatan;
      finalDepartemen = matched.departemen ?? finalDepartemen;
      finalKategori = matched.kategori ?? finalKategori;
      isWalkIn = false;
    } else {
      isWalkIn = true;
    }
  }

  // 4b. Verifikasi status sesi aktif
  const { data: sessionData } = await supabase
    .from("sessions")
    .select("id, nama, is_active")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionData && !sessionData.is_active) {
    return {
      status: "error",
      message: `Sesi ${sessionData.nama} saat ini sedang ditutup oleh panitia.`,
    };
  }

  const sesiLabel = sessionData?.nama || getSessionLabel(sessionId);

  // 5. Insert ke tabel attendances
  const { data: inserted, error } = await supabase
    .from("attendances")
    .insert({
      session_id: sessionId,
      guest_id: guestId,
      nama: finalNama,
      perwakilan_daerah: finalDaerah,
      jabatan: finalJabatan,
      departemen: finalDepartemen,
      kategori: finalKategori,
      is_walk_in: isWalkIn,
      ticket_nonce: ticket.nonce,
      device_hash: deviceHash,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Unique violation constraint code 23505
    if (error.code === "23505") {
      const detail = `${error.message ?? ""} ${error.details ?? ""}`;
      if (detail.includes("attendances_unique_ticket")) {
        return { status: "error", message: SCAN_AGAIN_MESSAGE };
      }
      if (detail.includes("attendances_unique_device")) {
        return {
          status: "already",
          message: `HP ini sudah dipakai untuk absen di ${sesiLabel}. Setiap peserta wajib absen dari HP masing-masing.`,
        };
      }
      return {
        status: "already",
        message: `Anda sudah tercatat hadir di ${sesiLabel}.`,
      };
    }
    return {
      status: "error",
      message: "Terjadi kendala saat menyimpan absensi. Silakan coba lagi.",
    };
  }

  if (!inserted) {
    return {
      status: "already",
      message: `Anda sudah tercatat hadir di ${sesiLabel}.`,
    };
  }

  // 6. Sukses
  return {
    status: "ok",
    nama: finalNama,
    sesi: sesiLabel,
  };
}
