"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

interface AutoScrollContainerProps {
  children: ReactNode;
  className?: string;
  speed?: number; // pixels per second (default 25)
  pauseMs?: number; // pause at ends (default 3000ms)
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
  speed = 25,
  pauseMs = 3000,
}: AutoScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    if (isReducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    let animId: number;
    let lastTime = performance.now();
    let direction: "down" | "up" = "down";
    let isPaused = false;
    let pauseTimeout: NodeJS.Timeout | null = null;

    const tick = (now: number) => {
      if (!el) return;

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const maxScroll = el.scrollHeight - el.clientHeight;

      // Jika konten muat dalam container (tidak ada overflow), tidak perlu auto-scroll
      if (maxScroll <= 8) {
        animId = requestAnimationFrame(tick);
        return;
      }

      if (isPaused) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const move = speed * delta;

      if (direction === "down") {
        const nextPos = el.scrollTop + move;
        if (nextPos >= maxScroll) {
          el.scrollTop = maxScroll;
          direction = "up";
          isPaused = true;
          pauseTimeout = setTimeout(() => {
            isPaused = false;
            lastTime = performance.now();
          }, pauseMs);
        } else {
          el.scrollTop = nextPos;
        }
      } else {
        const nextPos = el.scrollTop - move;
        if (nextPos <= 0) {
          el.scrollTop = 0;
          direction = "down";
          isPaused = true;
          pauseTimeout = setTimeout(() => {
            isPaused = false;
            lastTime = performance.now();
          }, pauseMs);
        } else {
          el.scrollTop = nextPos;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [speed, pauseMs, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto no-scrollbar scroll-smooth ${className}`}
    >
      {children}
    </div>
  );
}
