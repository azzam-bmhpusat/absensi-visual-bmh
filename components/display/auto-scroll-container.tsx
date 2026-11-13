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
}

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
}: AutoScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);

  const [shouldLoop, setShouldLoop] = useState(false);
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

      const hasOverflow = primary.offsetHeight > container.clientHeight + 4;
      setShouldLoop(hasOverflow);
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
  }, [children]);

  // Animasi Continuous Seamless Scroll (Looping Unlimited)
  useEffect(() => {
    if (isReducedMotion || !shouldLoop) return;

    const el = containerRef.current;
    const primary = primaryRef.current;
    const clone = cloneRef.current;
    if (!el || !primary || !clone) return;

    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Jalankan animasi jika tidak sedang di-pause oleh hover kursor
      if (!isHoveredRef.current) {
        // Hitung jarak threshold loop dari clone offsetTop ke primary offsetTop
        const loopThreshold = clone.offsetTop - primary.offsetTop;

        if (loopThreshold > 0) {
          let nextScroll = el.scrollTop + speed * delta;

          if (nextScroll >= loopThreshold) {
            // Seamless instant reset: kurangi dengan loopThreshold persis
            nextScroll -= loopThreshold;
          }

          el.scrollTop = nextScroll;
        }
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
      <div className="flex flex-col gap-3.5">
        <div ref={primaryRef}>{children}</div>
        {shouldLoop && (
          <div ref={cloneRef} aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
