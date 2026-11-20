"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import "lenis/dist/lenis.css";

/**
 * Smooth scroll (Lenis) untuk satu route/layout. Pasang hanya yang memang
 * memerlukannya (layout situs publik (site): beranda dan /registrasi, serta /absen)
 * — Lenis otomatis dilepas saat unmount.
 * Pengguna dengan prefers-reduced-motion tetap memakai scroll native.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <ReactLenis
      root
      options={{ lerp: 0.1, smoothWheel: !reduceMotion, anchors: false }}
    >
      {children}
    </ReactLenis>
  );
}
