"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface AutoScrollContainerProps {
  children: ReactNode;
  className?: string;
  speed?: number; // pixels per second (default 28)
  pauseOnHover?: boolean; // jeda saat kursor mouse di-hover
  enabled?: boolean; // matikan loop (mis. saat daftar kosong)
  /**
   * Loop berjalan bila tinggi konten > rasio ini × tinggi container.
   * Di bawah 1 agar tetap bergulir saat browser di-zoom out (mis. 50%),
   * ketika container memanjang dan seluruh konten sebenarnya sudah muat.
   */
  minFillRatio?: number;
}

const GAP_PX = 14; // sama dengan gap-3.5 antar salinan

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function AutoScrollContainer({
  children,
  className = "",
  speed = 28,
  pauseOnHover = true,
  enabled = true,
  minFillRatio = 0.35,
}: AutoScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);

  // Jumlah salinan konten untuk loop; 0 = tidak loop
  const [cloneCount, setCloneCount] = useState(0);
  const shouldLoop = cloneCount > 0;
  const isHoveredRef = useRef(false);

  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Periksa apakah konten melebihi tinggi container (overflow)
  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const primary = primaryRef.current;
      if (!container || !primary) return;

      const contentH = primary.offsetHeight;
      const containerH = container.clientHeight;

      if (!enabled || contentH === 0 || contentH <= containerH * minFillRatio) {
        setCloneCount(0);
        return;
      }

      // Cukup salinan agar jarak scroll >= satu siklus penuh, walau konten
      // lebih pendek dari container (zoom out)
      const cycle = contentH + GAP_PX;
      const extra = Math.max(0, Math.ceil((containerH - contentH + GAP_PX) / cycle));
      setCloneCount(1 + extra);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (primaryRef.current) resizeObserver.observe(primaryRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, enabled, minFillRatio]);

  // Animasi Continuous Seamless Scroll (Looping Unlimited)
  useEffect(() => {
    if (isReducedMotion || !shouldLoop) return;

    const el = containerRef.current;
    const primary = primaryRef.current;
    const clone = cloneRef.current;
    if (!el || !primary || !clone) return;

    let animId: number;
    let lastTime = performance.now();
    // Posisi scroll pecahan disimpan sendiri. Browser membulatkan scrollTop ke
    // piksel perangkat; pada zoom 80% (atau DPR 1) langkah per frame (~0,47 px)
    // selalu dibulatkan kembali ke posisi semula sehingga scroll macet.
    let position = el.scrollTop;

    const tick = (now: number) => {
      // Batasi delta agar tidak melompat jauh setelah tab tidak aktif
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Jalankan animasi jika tidak sedang di-pause oleh hover kursor
      if (!isHoveredRef.current) {
        // Hitung jarak threshold loop dari clone offsetTop ke primary offsetTop
        const loopThreshold = clone.offsetTop - primary.offsetTop;

        if (loopThreshold > 0) {
          // Sinkronkan jika posisi diubah dari luar (mis. scroll manual)
          if (Math.abs(el.scrollTop - position) > 2) {
            position = el.scrollTop;
          }

          position += speed * delta;

          if (position >= loopThreshold) {
            // Seamless instant reset: kurangi dengan loopThreshold persis
            position -= loopThreshold;
          }

          el.scrollTop = position;
        }
      } else {
        position = el.scrollTop;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [speed, isReducedMotion, shouldLoop]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        if (pauseOnHover) isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseOnHover) isHoveredRef.current = false;
      }}
      className={`overflow-y-auto no-scrollbar ${className}`}
    >
      {/* Padding agar ring/glow sorotan kartu tidak terpotong oleh overflow container */}
      <div className="flex flex-col gap-3.5 px-1.5 pt-1.5 pb-0.5">
        <div ref={primaryRef}>{children}</div>
        {Array.from({ length: cloneCount }, (_, i) => (
          <div key={i} ref={i === 0 ? cloneRef : undefined} aria-hidden="true">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
