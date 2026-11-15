import Image from "next/image";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT_INFO } from "@/content/rakernas";

export function HeroSection() {
  return (
    <section className="relative w-full py-12 md:py-20 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-500">
      <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Logo Visual Hero (Mobile: di atas; lg: kolom kanan) */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center">
            <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl inline-flex items-center justify-center max-w-[320px] lg:max-w-[420px] w-full transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src={EVENT_INFO.logoSrc}
                alt={EVENT_INFO.logoAlt}
                width={420}
                height={402}
                priority
                sizes="(max-width: 768px) 280px, (max-width: 1024px) 360px, 420px"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Kolom Teks (Mobile: di bawah logo; lg: kolom kiri) */}
          <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Judul Utama (H1) */}
            <h1 className="text-3xl md:text-5xl xl:text-6xl font-heading font-bold text-foreground leading-tight tracking-tight">
              {EVENT_INFO.title}
            </h1>

            {/* Tema Acara (H2 Kutipan) */}
            <h2 className="text-lg md:text-2xl xl:text-3xl font-heading font-semibold text-brand-gold-soft mt-4 md:mt-6 leading-snug">
              &ldquo;{EVENT_INFO.theme}&rdquo;
            </h2>

            {/* Tanggal Acara */}
            <div className="mt-6 md:mt-8 flex flex-col items-center lg:items-start">
              <span className="text-6xl md:text-8xl xl:text-9xl font-heading font-bold text-brand-gold-soft tabular-nums tracking-tight leading-none">
                {EVENT_INFO.dateDays}
              </span>
              <span className="text-xl md:text-2xl font-heading font-medium text-foreground tracking-wide mt-2">
                {EVENT_INFO.dateMonthYear}
              </span>
            </div>

            {/* Tombol Lokasi Hotel */}
            <div className="mt-6 md:mt-8 w-full sm:w-auto flex justify-center lg:justify-start">
              <Button
                nativeButton={false}
                render={
                  <a
                    href={EVENT_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                className="h-12 px-6 rounded-lg bg-brand-gold-soft text-brand-green-night hover:bg-brand-gold font-heading font-semibold shadow-md w-full sm:w-auto text-base transition-colors inline-flex items-center justify-center gap-2"
              >
                <MapPin className="size-5 shrink-0" />
                <span>{EVENT_INFO.hotel}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
