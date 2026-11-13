"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft, QrCode as QrIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface QrCardProps {
  siteUrl: string;
  eventName: string;
}

export function QrCard({ siteUrl, eventName }: QrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const targetUrl = `${siteUrl.replace(/\/$/, "")}/absen`;

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: "#134B40", // green-900 (deep green BMH brand)
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("Gagal generate QR Code:", err);
      });
  }, [targetUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-presensi-bmh.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Gambar kode QR berhasil diunduh!");
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Navigasi & Aksi (Disembunyikan saat dicetak) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary transition-colors py-2 px-3 rounded-xl hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Panel Admin
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQr}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-line text-primary hover:border-brand-green"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-brand-gold-text" />
            Unduh PNG
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-brand-green-deep text-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-brand-gold-soft" />
            Cetak Standee
          </Button>
        </div>
      </div>

      {/* Kartu Cetak QR Utama */}
      <div className="bg-white border-2 border-primary/25 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        {/* Header Acara */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-gold-100 text-brand-gold-text text-xs font-bold tracking-widest uppercase">
            Presensi Digital Acara
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary max-w-md mx-auto leading-tight">
            {eventName}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto">
            Silakan pindai kode QR di bawah menggunakan kamera ponsel Anda untuk
            mencatat kehadiran.
          </p>
        </div>

        {/* Gambar QR Code */}
        <div className="flex justify-center my-6">
          <div className="relative p-4 rounded-2xl border-4 border-primary/15 bg-white shadow-xs inline-block print:border-2 print:border-primary/40">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Kode QR Presensi Acara"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
              />
            ) : (
              <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-surface">
                <QrIcon className="w-16 h-16 text-ink-muted/30 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Petunjuk & URL */}
        <div className="space-y-1.5 pt-2 border-t border-line/60 max-w-sm mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-green-deep">
            Scan untuk absen
          </div>
          <div className="text-xs font-mono font-semibold text-primary break-all bg-surface py-1.5 px-3 rounded-lg border border-line">
            {targetUrl}
          </div>
          <p className="text-[11px] text-ink-muted">
            Satu kode QR untuk presensi <strong>Hari Pertama</strong> &{" "}
            <strong>Hari Kedua</strong>
          </p>
        </div>

        {/* Footer identitas BMH */}
        <div className="text-[10px] text-ink-muted/80 tracking-wide uppercase font-medium pt-2">
          Baitul Maal Hidayatullah &bull; Presensi Kehadiran Realtime
        </div>
      </div>
    </div>
  );
}
