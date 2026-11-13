import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Monitor, QrCode, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="page-bg min-h-screen py-12 px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <Badge className="bg-secondary text-primary border-brand-green/30 px-3 py-1 text-xs">
            Fase 0 — Setup Proyek Selesai
          </Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-primary tracking-tight">
            Sistem Absensi Visual QR BMH
          </h1>
          <p className="text-base text-ink-muted max-w-xl mx-auto">
            Kerangka proyek terinisialisasi dengan Next.js App Router, Tailwind CSS, shadcn/ui, dan token desain resmi BMH.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/absen"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-xl bg-primary hover:bg-brand-green-deep text-white font-medium h-10 px-5"
              )}
            >
              Mulai Absensi <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/display"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl border-line text-primary hover:bg-secondary h-10 px-5"
              )}
            >
              Buka Layar Videotron
            </Link>
          </div>
        </div>

        {/* Visual Token Palette Check */}
        <Card className="rounded-2xl border-line shadow-sm overflow-hidden">
          <CardHeader className="bg-surface/50 border-b border-line pb-4">
            <CardTitle className="font-heading text-base text-primary flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-green" />
              Verifikasi Palet Desain BMH (Design System)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-[#134B40] text-white space-y-1">
                <div className="text-xs uppercase font-medium text-white/70">Primer</div>
                <div className="font-bold text-sm">Hijau Tua</div>
                <div className="text-[11px] font-mono text-white/60">#134B40</div>
              </div>
              <div className="p-4 rounded-xl bg-[#3FBF8F] text-[#0A3A30] space-y-1">
                <div className="text-xs uppercase font-medium text-[#0A3A30]/70">Aksen Utama</div>
                <div className="font-bold text-sm">Hijau Terang</div>
                <div className="text-[11px] font-mono text-[#0A3A30]/70">#3FBF8F</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0A3A30] text-white space-y-1">
                <div className="text-xs uppercase font-medium text-white/70">Videotron</div>
                <div className="font-bold text-sm">Hijau Malam</div>
                <div className="text-[11px] font-mono text-white/60">#0A3A30</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F2D06B] text-[#0A3A30] space-y-1">
                <div className="text-xs uppercase font-medium text-[#0A3A30]/70">Aksen Emas</div>
                <div className="font-bold text-sm">Kuning Emas</div>
                <div className="text-[11px] font-mono text-[#0A3A30]/70">#F2D06B</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary border border-brand-green/20 text-xs text-primary flex items-center justify-between">
              <span className="font-medium">Typography:</span>
              <span className="font-heading font-bold text-sm">Heading: Poppins 600/700</span>
              <span className="font-sans font-normal text-sm">Body: Inter 400/500</span>
            </div>
          </CardContent>
        </Card>

        {/* Navigation to App Routes */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/absen" className="group">
            <Card className="h-full rounded-2xl border-line hover:border-brand-green hover:-translate-y-1 transition-all shadow-sm p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-primary text-base">Alur Absen Peserta</h2>
                <p className="text-xs text-ink-muted">Pilihan sesi & dialog kehadiran</p>
              </div>
              <div className="text-xs text-brand-gold-text font-semibold flex items-center gap-1">
                Buka /absen <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </Link>

          <Link href="/display" className="group">
            <Card className="h-full rounded-2xl border-line hover:border-brand-green hover:-translate-y-1 transition-all shadow-sm p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-primary text-base">Layar Videotron</h2>
                <p className="text-xs text-ink-muted">Tampilan realtime layar besar</p>
              </div>
              <div className="text-xs text-brand-gold-text font-semibold flex items-center gap-1">
                Buka /display <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </Link>

          <Link href="/admin" className="group">
            <Card className="h-full rounded-2xl border-line hover:border-brand-green hover:-translate-y-1 transition-all shadow-sm p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-primary text-base">Panel Admin</h2>
                <p className="text-xs text-ink-muted">Import CSV, rekap & cetak QR</p>
              </div>
              <div className="text-xs text-brand-gold-text font-semibold flex items-center gap-1">
                Buka /admin <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-ink-muted">
          Siap melangkah ke <span className="font-semibold text-primary">Fase 1 — Database & Klien Supabase</span>
        </div>
      </div>
    </main>
  );
}
