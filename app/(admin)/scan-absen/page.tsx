import { createPublicServerClient } from "@/lib/supabase/server";
import { QrScanner } from "@/components/admin/qr-scanner";

export default async function ScanAbsenPage() {
  const { data } = await createPublicServerClient()
    .from("sessions")
    .select("id, nama, is_active")
    .order("id", { ascending: true });
  const sessions = (data || []).map((s) => ({ id: s.id as number, nama: s.nama as string, aktif: s.is_active !== false }));

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Scan QR Absensi</h1>
        <p className="text-sm text-ink-muted">Arahkan kamera ke QR pribadi peserta/panitia (ada di halaman Profil mereka).</p>
      </div>
      <QrScanner sessions={sessions} />
    </div>
  );
}
