import type { AttendanceData, GuestData, SessionData } from "@/lib/display-helpers";

/** Bentuk data langsung yang dipakai adegan (cocok dengan keluaran useDisplayRealtime). */
export interface LiveData {
  session: SessionData;
  guests: GuestData[];
  hadir: AttendanceData[];
  hadirCount: number;
  totalGuests: number;
  percentage: number;
  status: "connected" | "reconnecting";
  /** absensi baru yang belum selesai "dirayakan" (urut datang) */
  welcome: Array<{ id: string }>;
  dismissWelcome: (id: string) => void;
}
