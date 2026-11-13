import { SessionPicker } from "@/components/absen/session-picker";

export default function AbsenPage() {
  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-primary">
            Sistem Absensi
          </span>
          <h1 className="font-heading text-2xl font-bold text-primary">
            Silaturahim & Rakornas BMH
          </h1>
          <p className="text-sm text-ink-muted">
            Silakan pilih sesi kehadiran di bawah ini untuk mencatat absensi Anda.
          </p>
        </div>
        <SessionPicker />
      </div>
    </main>
  );
}
