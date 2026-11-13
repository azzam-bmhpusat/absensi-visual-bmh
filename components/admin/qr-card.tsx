"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RoundedQr } from "@/components/admin/rounded-qr";

interface QrCardProps {
  siteUrl: string;
  eventName?: string;
}

export function QrCard({ siteUrl, eventName }: QrCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const targetUrl = `${siteUrl.replace(/\/$/, "")}/absen`;

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
        // Ukuran high-res 1200 x 1200 agar tetap tajam saat dicetak
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
          toast.success("Gambar QR Code (PNG) berhasil diunduh!");
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
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Navigasi & Aksi (Disembunyikan saat dicetak) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary transition-colors py-2 px-3 rounded-xl hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Panel Admin
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSvg}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-line text-primary hover:border-brand-green"
            title="Unduh format vektor SVG"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-brand-gold-text" />
            SVG
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-line text-primary hover:border-brand-green"
            title="Unduh format gambar PNG resolusi tinggi"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-brand-gold-text" />
            PNG
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-primary hover:bg-brand-green-deep text-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-brand-gold-soft" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Satu Kartu Putih Sederhana (radius 24px, border 1px #DDE7E2) */}
      <div className="bg-white border border-[#DDE7E2] rounded-[24px] p-8 sm:p-10 shadow-xs text-center flex flex-col items-center justify-center space-y-5 print:border print:border-[#DDE7E2] print:rounded-[24px] print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-[12cm] print:mx-auto">
        {/* Render SVG Rounded QR Code */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 print:w-[7.5cm] print:h-[7.5cm] flex items-center justify-center">
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

        {/* Teks "Scan untuk absen" di bawah QR (Poppins, hijau tua #134B40) */}
        <div className="space-y-1.5 pt-1">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-[#134B40] tracking-tight">
            Scan untuk absen
          </h2>
          <p className="text-xs font-mono font-medium text-ink-muted break-all max-w-xs">
            {targetUrl}
          </p>
        </div>

        {eventName && (
          <div className="text-[11px] text-ink-muted/80 tracking-wide font-medium pt-2 border-t border-line/60 w-full max-w-xs">
            {eventName}
          </div>
        )}
      </div>
    </div>
  );
}
