export interface RegistrationRow {
  id: string;
  nama: string;
  perwakilan_bmh: string;
  jabatan: string;
  departemen: string | null;
  ukuran_baju: string;
  mode_kehadiran: "offline" | "online";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function formatRegistrationDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
