import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";

export default function AdminQrPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Koordinasi Nasional BMH";

  return (
    <main className="min-h-screen bg-white p-8 flex items-center justify-center print:p-0">
      <Card className="max-w-md w-full border-2 border-primary/20 text-center p-8 rounded-3xl space-y-6 shadow-sm print:border-none print:shadow-none">
        <CardHeader className="space-y-2 p-0">
          <span className="text-xs font-bold tracking-widest text-brand-gold-text uppercase">
            Presensi Digital Acara
          </span>
          <CardTitle className="font-heading text-2xl font-bold text-primary">
            {eventName}
          </CardTitle>
          <p className="text-sm text-ink-muted">
            Pindai kode QR berikut menggunakan kamera ponsel Anda
          </p>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center space-y-4">
          <div className="w-56 h-56 rounded-2xl border-4 border-primary/10 flex items-center justify-center bg-surface">
            <QrCode className="w-40 h-40 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-primary">{siteUrl}/absen</div>
            <div className="text-xs text-ink-muted">Scan untuk memilih sesi dan mencatat kehadiran</div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
