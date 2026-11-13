"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw, QrCode } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <Card className="p-8 rounded-3xl border-line bg-card shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-danger flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-danger border border-red-200">
              Kendala Sistem
            </span>
            <h1 className="font-heading text-2xl font-bold text-primary tracking-tight">
              Terjadi Kendala Teknis
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Sistem mendeteksi kendala saat memuat data. Silakan coba muat ulang atau kembali ke halaman absensi.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => reset()}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-brand-gold" />
              Coba Lagi
            </Button>
            <Link
              href="/absen"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-line text-primary hover:bg-secondary gap-2 text-sm font-medium"
            >
              <QrCode className="w-4 h-4" />
              Halaman Absen
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
