"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Printer, Download, Copy, Check, MonitorPlay } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  RoundedQr,
  resolveQrTargetUrl,
} from "@/components/admin/rounded-qr";

interface QrCardProps {
  siteUrl?: string;
  eventName?: string;
}

export function QrCard({ siteUrl, eventName }: QrCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const targetUrl = resolveQrTargetUrl(siteUrl);

  // Hitung ukuran matriks QR nyata (jangan hardcode)
  const qrMatrixSize = useMemo(() => {
    try {
      const qr = QRCode.create(targetUrl, { errorCorrectionLevel: "M" });
      return qr.modules.size;
    } catch {
      return 29;
    }
  }, [targetUrl]);

  // Ekstrak hostname nyata dari targetUrl
  const targetHostname = useMemo(() => {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  }, [targetUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      toast.success("Tautan presensi berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin tautan:", err);
      toast.error("Gagal menyalin tautan ke clipboard.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-presensi-bmh.svg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("File QR Code (SVG) berhasil diunduh!");
    } catch (err) {
      console.error("Gagal mengunduh SVG:", err);
      toast.error("Gagal mengunduh file SVG.");
    }
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const blobURL = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = "qr-presensi-bmh.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("Gambar QR Code (PNG) 1200×1200px berhasil diunduh!");
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Gagal mengunduh PNG:", err);
      toast.error("Gagal mengunduh gambar PNG.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto lg:mx-0 space-y-3 lg:space-y-4">
      {/* QR dinamis wajib dipakai saat acara */}
      <div className="rounded-2xl border border-brand-gold-soft bg-gold-50 p-3 text-left space-y-2 print:hidden">
        <p className="text-[11px] leading-relaxed text-brand-gold-text">
          QR cetak di bawah <strong>tidak lagi bisa dipakai untuk absen</strong>. Absensi kini wajib lewat QR dinamis yang berganti
          setiap 30 detik, sehingga link tidak bisa dibagikan dan 1 scan hanya berlaku untuk 1 kali absen.
        </p>
        <Link
          href="/admin/qr/live"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold bg-primary text-white shadow-xs"
        >
          <MonitorPlay className="w-3.5 h-3.5" />
          Tampilkan QR Dinamis di Layar
        </Link>
      </div>

      {/* Toolbar Aksi Minimalis */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="h-8 px-2.5 rounded-xl text-[11px] font-semibold border-line text-primary hover:border-brand-green bg-white shadow-2xs transition-colors"
          title="Salin tautan halaman absen"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1 text-brand-green" />
              <span className="text-brand-green font-bold">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1 text-ink-muted" />
              Salin Tautan
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadSvg}
          className="h-8 px-2.5 rounded-xl text-[11px] font-semibold border-line text-primary hover:border-brand-green bg-white shadow-2xs transition-colors"
          title="Unduh format vektor SVG murni"
        >
          <Download className="w-3 h-3 mr-1 text-ink-muted" />
          SVG
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPng}
          className="h-8 px-2.5 rounded-xl text-[11px] font-semibold border-line text-primary hover:border-brand-green bg-white shadow-2xs transition-colors"
          title="Unduh gambar PNG 1200×1200px resolusi tinggi"
        >
          <Download className="w-3 h-3 mr-1 text-ink-muted" />
          PNG
        </Button>

        <Button
          size="sm"
          onClick={handlePrint}
          className="h-8 px-3 rounded-xl text-[11px] font-semibold bg-primary hover:bg-[#0A3A30] text-white shadow-xs ml-auto transition-colors"
          title="Buka dialog cetak dokumen (Ctrl+P)"
        >
          <Printer className="w-3 h-3 mr-1.5 text-[#3FBF8F]" />
          Cetak
        </Button>
      </div>

      {/* Kartu QR Putih Minimalis — ukuran QR responsif viewport */}
      <div className="bg-white border border-[#DDE7E2] rounded-[24px] p-6 lg:p-7 xl:p-8 shadow-xs text-center flex flex-col items-center justify-center space-y-4 lg:space-y-3 print:border print:border-[#DDE7E2] print:rounded-[24px] print:shadow-none print:p-8 print:m-0 print:w-full print:max-w-[12cm] print:mx-auto">
        {/* QR Code — sizing: max 60vh on desktop to prevent overflow */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 lg:w-[min(18rem,42vh)] lg:h-[min(18rem,42vh)] xl:w-[min(20rem,46vh)] xl:h-[min(20rem,46vh)] print:w-[7.5cm] print:h-[7.5cm] flex items-center justify-center select-none">
          <RoundedQr
            svgRef={svgRef}
            value={targetUrl}
            level="M"
            margin={4}
            color="#134B40"
            bgColor="#FFFFFF"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Teks "Scan untuk absen" */}
        <div className="space-y-1 pt-0.5">
          <h2 className="font-heading text-lg sm:text-xl lg:text-xl font-bold text-[#134B40] tracking-tight">
            Scan untuk absen
          </h2>
          <p className="text-[11px] font-mono font-medium text-ink-muted break-all max-w-sm">
            {targetUrl}
          </p>
        </div>

        {eventName && (
          <div className="text-[10px] text-ink-muted/80 tracking-wide font-medium pt-2 border-t border-line/60 w-full max-w-sm">
            {eventName}
          </div>
        )}
      </div>

      {/* Baris Spesifikasi (Micro-badges Faktual) */}
      <div
        className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 print:hidden"
        aria-label="Spesifikasi teknis QR code"
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line bg-white/70 text-ink-muted text-[10px] font-mono shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
          ECC: M
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line bg-white/70 text-ink-muted text-[10px] font-mono shadow-2xs">
          Grid: {qrMatrixSize}×{qrMatrixSize}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line bg-white/70 text-ink-muted text-[10px] font-mono shadow-2xs truncate max-w-[200px]">
          {targetHostname}
        </span>
      </div>
    </div>
  );
}
