import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/login-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Kerja Nasional BMH 2026";

  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-5 relative">
      {/* Tombol kembali ke halaman absen */}
      <div className="absolute top-6 left-6">
        <Link
          href="/absen"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-white/80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Halaman Presensi
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-brand-green-deep text-[11px] font-bold tracking-wider uppercase mb-1">
            Panel Administrasi
          </div>
          <h1 className="font-heading text-lg font-bold text-primary line-clamp-2">
            {eventName}
          </h1>
        </div>

        <Card className="rounded-3xl shadow-sm border-line bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="font-heading text-xl text-primary font-bold">
              Masuk Panitia
            </CardTitle>
            <p className="text-xs text-ink-muted">
              Masukkan kredensial panitia untuk mengelola data kehadiran
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-6 px-6">
            <AdminLoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-ink-muted">
          Sistem Absensi Digital Lembaga Amil Zakat BMH
        </p>
      </div>
    </main>
  );
}
