import { createPublicServerClient } from "@/lib/supabase/server";
import { QrScanner } from "@/components/admin/qr-scanner";
import { Card, CardContent } from "@/components/ui/card";

export default async function ScanAbsenPage() {
  const { data } = await createPublicServerClient()
    .from("sessions")
    .select("id, nama, is_active")
    .order("id", { ascending: true });
  const sessions = (data || []).map((s) => ({ id: s.id as number, nama: s.nama as string, aktif: s.is_active !== false }));

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-primary">Scan QR Absensi</h1>
        <p className="text-sm leading-relaxed text-ink-muted">Pilih sesi, lalu arahkan kamera ke QR pribadi peserta/panitia di halaman Profil mereka.</p>
      </div>
      <Card className="gap-0 rounded-2xl border border-line bg-white/95 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <QrScanner sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
