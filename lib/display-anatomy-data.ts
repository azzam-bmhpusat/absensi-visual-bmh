import { createPublicServerClient } from "@/lib/supabase/server";
import {
  resolveActiveSession,
  type AttendanceData,
  type GuestData,
  type SessionData,
} from "@/lib/display-helpers";
import { ATTENDANCE_COLUMNS, GUEST_COLUMNS } from "@/lib/display-anatomy-model";

/** Data awal /display-anatomy (logika sama dengan loader /display, tanpa mengubahnya). */
export interface DisplayAnatomyData {
  eventName: string;
  sessions: SessionData[];
  activeSession: SessionData;
  guests: GuestData[];
  attendances: AttendanceData[];
}

const FALLBACK_SESSIONS: SessionData[] = [
  { id: 1, slug: "hari-1-pagi", nama: "Absen Masuk Pagi", hari: 1 },
  { id: 2, slug: "hari-1-isoma", nama: "Masuk Setelah Isoma", hari: 1 },
  { id: 3, slug: "hari-1-malam", nama: "Masuk Setelah Makan Malam", hari: 1 },
  { id: 4, slug: "hari-2-pagi", nama: "Absen Masuk Pagi", hari: 2 },
  { id: 5, slug: "hari-2-isoma", nama: "Masuk Setelah Isoma", hari: 2 },
  { id: 6, slug: "hari-2-malam", nama: "Masuk Setelah Makan Malam", hari: 2 },
  { id: 7, slug: "hari-3-pagi", nama: "Absen Masuk Pagi", hari: 3 },
  { id: 8, slug: "hari-3-isoma", nama: "Masuk Setelah Isoma", hari: 3 },
  { id: 9, slug: "hari-3-malam", nama: "Masuk Setelah Makan Malam", hari: 3 },
];


export async function loadDisplayAnatomyData(querySesi?: string | string[]): Promise<DisplayAnatomyData> {
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH 2027";
  const supabase = createPublicServerClient();
  let sessions = FALLBACK_SESSIONS;
  let guests: GuestData[] = [];
  let attendances: AttendanceData[] = [];

  try {
    const [sessRes, guestsRes] = await Promise.all([
      supabase.from("sessions").select("id, slug, nama, tanggal, hari, is_active").order("id", { ascending: true }),
      supabase
        .from("profiles")
        .select(GUEST_COLUMNS)
        .not("nama", "is", null)
        .order("perwakilan_daerah", { ascending: true })
        .order("nama", { ascending: true }),
    ]);
    if (sessRes.data && sessRes.data.length > 0) sessions = sessRes.data;
    if (guestsRes.data) guests = guestsRes.data;
  } catch (err) {
    console.error("Gagal memuat sesi atau tamu untuk display-anatomy:", err);
  }

  const activeSession = resolveActiveSession(sessions, querySesi);

  try {
    const { data } = await supabase
      .from("attendances")
      .select(ATTENDANCE_COLUMNS)
      .eq("session_id", activeSession.id)
      .order("checked_in_at", { ascending: false });
    if (data) attendances = data;
  } catch (err) {
    console.error("Gagal memuat absensi untuk display-anatomy:", err);
  }

  return { eventName, sessions, activeSession, guests, attendances };
}
