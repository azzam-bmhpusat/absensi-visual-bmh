"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatWibClock } from "@/lib/display-helpers";
import { Maximize2, Minimize2 } from "lucide-react";

interface DisplayHeaderProps {
  eventName: string;
  sessionName: string;
}

export function DisplayHeader({
  eventName,
  sessionName,
}: DisplayHeaderProps) {
  const [clock, setClock] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => setClock(formatWibClock());

    // Tick pertama secara asinkron agar tidak memicu cascading renders
    const initialTimer = setTimeout(update, 0);
    const interval = setInterval(update, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Gagal mengubah mode layar:", err);
    }
  };

  return (
    <header className="flex items-center justify-between min-h-[84px] xl:min-h-[90px] border-b border-border/40 pb-3 xl:pb-4 gap-4 flex-wrap">
      {/* Kolom Kiri: Logo BMH + Judul Acara & Subjudul */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 shrink-0 rounded-2xl bg-white/10 p-1.5 border border-white/15 flex items-center justify-center shadow-xs backdrop-blur-xs">
          <Image
            src="/logo.png"
            alt="Logo BMH"
            width={64}
            height={64}
            className="w-full h-full object-contain drop-shadow-sm"
            priority
          />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-xs xl:text-sm uppercase tracking-wider font-semibold text-brand-gold-soft">
            Layar Kehadiran Realtime
          </span>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-heading font-bold text-white tracking-tight leading-tight">
            {eventName}
          </h1>
        </div>
      </div>

      {/* Kolom Kanan: Sesi Aktif, Jam Digital WIB, dan Tombol Fullscreen */}
      <div className="flex items-center gap-3 xl:gap-4 ml-auto">
        <div className="text-right flex flex-col justify-center items-end">
          <div className="text-lg sm:text-xl xl:text-2xl font-heading font-bold text-brand-gold-soft leading-tight">
            {sessionName}
          </div>
          <div className="text-sm sm:text-base xl:text-lg font-mono font-medium text-white/90 flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-green animate-pulse" />
            <span>{clock || "--:--:-- WIB"}</span>
          </div>
        </div>

        {/* Tombol Maximize / Minimize Fullscreen */}
        <button
          onClick={toggleFullscreen}
          type="button"
          aria-label={
            isFullscreen
              ? "Kecilkan layar (Minimize)"
              : "Maksimalkan layar (Maximize)"
          }
          title={
            isFullscreen
              ? "Kecilkan Layar (Minimize)"
              : "Maksimalkan Layar (Maximize / Fullscreen)"
          }
          className="p-2.5 xl:p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white border border-white/15 transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 xl:w-6 xl:h-6 text-brand-gold-soft" />
          ) : (
            <Maximize2 className="w-5 h-5 xl:w-6 xl:h-6 text-brand-green-text" />
          )}
        </button>
      </div>
    </header>
  );
}
