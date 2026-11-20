import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { QrCard } from "@/components/admin/qr-card";
import { LinearDynamicFigures } from "@/components/admin/linear-dynamic-figures";

export default function AdminQrPage() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl =
    !envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")
      ? "https://absensi-visual-bmh.vercel.app"
      : envUrl;
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME ||
    "Silaturahim & Rapat Kerja Nasional BMH 2027";

  return (
    <main
      className={[
        // Base (mobile): scrollable
        "page-bg min-h-screen py-6 px-4 sm:py-8 sm:px-6",
        // Desktop (lg+): single viewport, no scroll
        "lg:h-screen lg:max-h-screen lg:overflow-hidden lg:py-5 lg:px-8 xl:px-10",
        "lg:flex lg:flex-col",
        // Print
        "print:bg-white print:bg-none print:py-0 print:px-0 print:m-0 print:min-h-0 print:block print:h-auto print:max-h-none print:overflow-visible",
      ].join(" ")}
    >
      <div
        className={[
          "w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto",
          "space-y-4 lg:space-y-0",
          // Desktop: flex column, fill viewport
          "lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:gap-4",
          // Print
          "print:m-0 print:w-full print:max-w-none print:space-y-0 print:block print:h-auto",
        ].join(" ")}
      >
        {/* Header — compact bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60 lg:shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-primary transition-colors py-1.5 px-2.5 rounded-xl bg-white border border-line shadow-2xs hover:border-ring"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            <div className="h-3.5 w-px bg-line" aria-hidden="true" />

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-medium text-ink-muted">
                Admin
              </span>
              <span className="text-[11px] text-ink-muted">/</span>
              <span className="text-[11px] font-semibold text-primary font-heading">
                Panel Cetak & QR Presensi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted bg-white/80 border border-line px-2.5 py-1 rounded-full shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-brand-green-text" />
            <span className="hidden sm:inline">Sistem Presensi Resmi</span>
            <span className="font-semibold text-primary">{eventName}</span>
          </div>
        </header>

        {/* Grid — fills remaining height on lg+ */}
        <div
          className={[
            "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start",
            // Desktop: stretch to fill
            "lg:flex-1 lg:min-h-0 lg:items-stretch",
            // Print
            "print:block print:w-full print:m-0 print:h-auto",
          ].join(" ")}
        >
          {/* Left Column (7 cols) — QR Card, Toolbar, Specs */}
          <section
            className={[
              "lg:col-span-7 flex flex-col items-center lg:items-start w-full",
              "lg:h-full lg:justify-center",
              "print:block print:w-full print:m-0 print:h-auto",
            ].join(" ")}
            aria-label="Area QR Code dan Kontrol"
          >
            <QrCard siteUrl={siteUrl} eventName={eventName} />
          </section>

          {/* Right Column (5 cols) — Linear Dynamic Figures */}
          <section
            className={[
              "lg:col-span-5 w-full",
              "lg:h-full lg:min-h-0 lg:flex lg:flex-col",
              "print:hidden",
            ].join(" ")}
            aria-label="Area Figur Isometrik"
          >
            <LinearDynamicFigures />
          </section>
        </div>
      </div>
    </main>
  );
}
