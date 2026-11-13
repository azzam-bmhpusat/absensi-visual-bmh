"use client";

import Link from "next/link";
import { QrCode, Monitor, ExternalLink, LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  eventName: string;
}

export function AdminHeader({ eventName }: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
    });
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-line">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-brand-green-deep text-[11px] font-bold tracking-wider uppercase mb-1">
          Panel Administrasi
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Pengelolaan Presensi Digital
        </h1>
        <p className="text-sm text-ink-muted line-clamp-1">{eventName}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/qr"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-secondary text-primary border border-line hover:border-brand-green hover:bg-green-100/60 transition-all shadow-2xs"
        >
          <QrCode className="w-4 h-4 text-brand-gold-text" />
          Cetak QR Absen
        </Link>

        <Link
          href="/display"
          target="_blank"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white text-primary border border-line hover:border-brand-green transition-all shadow-2xs"
        >
          <Monitor className="w-4 h-4 text-primary" />
          Buka Videotron
          <ExternalLink className="w-3 h-3 text-ink-muted" />
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isPending}
          className="h-9 px-3.5 rounded-xl text-xs font-semibold text-danger border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          {isPending ? "Keluar..." : "Keluar"}
        </Button>
      </div>
    </header>
  );
}
