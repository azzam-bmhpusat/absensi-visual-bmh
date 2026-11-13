import Link from "next/link";
import { Card } from "@/components/ui/card";
import { QrCode, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <Card className="p-8 rounded-3xl border-line bg-card shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary border border-brand-green/20 text-primary font-heading font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
            404
          </div>

          <div className="space-y-2">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
              Tidak Ditemukan
            </span>
            <h1 className="font-heading text-2xl font-bold text-primary tracking-tight">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Mohon maaf, halaman yang Anda tuju tidak tersedia atau tautan yang Anda buka kurang tepat.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/absen"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2 shadow-sm text-sm"
            >
              <QrCode className="w-4 h-4 text-brand-gold" />
              Halaman Absen
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-line text-primary hover:bg-secondary gap-2 text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </Card>

        <p className="text-xs text-ink-muted/80">
          Sistem Absensi Visual &bull; Baitul Maal Hidayatullah
        </p>
      </div>
    </main>
  );
}
