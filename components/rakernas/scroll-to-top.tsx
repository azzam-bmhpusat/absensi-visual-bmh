"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLenis } from "lenis/react";
import { cn } from "cn";

/** Jarak dari dasar halaman (px) saat tombol mulai tampil. */
const NEAR_BOTTOM_PX = 480;

/**
 * Tombol "kembali ke atas" yang muncul saat pengunjung hampir sampai di bawah halaman.
 * Diletakkan tepat di atas tombol WhatsApp melayang (lihat whatsapp-float.tsx) dan
 * ikut naik di atas tab bar HP lewat --bottom-nav-offset.
 */
export function ScrollToTop() {
  const lenis = useLenis();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight > window.innerHeight * 1.5;
      const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
      setVisible(scrollable && remaining <= NEAR_BOTTOM_PX);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis) lenis.scrollTo(0, { immediate: reduce });
    else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Kembali ke atas"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-[22px] bottom-[calc(1rem+56px+12px+var(--bottom-nav-offset))] z-50 flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-white/85 text-primary shadow-[0_8px_24px_#04362F2E,inset_0_1px_0_#FFFFFFE6] backdrop-blur-md transition-[opacity,transform] duration-200 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-opacity md:right-8 md:bottom-[calc(1.5rem+64px+12px+var(--bottom-nav-offset))] md:size-12",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp aria-hidden="true" className="size-5" strokeWidth={2.25} />
    </button>
  );
}
