"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";

interface AutoScrollContainerProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Ditampilkan bila `items` kosong */
  empty?: ReactNode;
  /** Props motion untuk setiap sel grid (animasi masuk/keluar) */
  itemMotion?: HTMLMotionProps<"div">;
  columns?: number;
  className?: string;
  speed?: number; // pixels per second (default 24)
  pauseOnHover?: boolean; // jeda saat kursor mouse di-hover
}

/** Jeda gulir setelah daftar berubah, agar animasi kartu baru selesai dulu. */
const SETTLE_MS = 1800;

function findCell(grid: HTMLElement | null, key: string | null) {
  if (!grid || !key) return null;
  return grid.querySelector<HTMLElement>(`:scope > [data-loop-key="${CSS.escape(key)}"]`);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
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

/**
 * Grid yang bergulir terus-menerus (seamless loop) untuk videotron.
 *
 * - Loop HANYA bila satu salinan daftar lebih tinggi dari container; daftar
 *   yang muat ditampilkan diam (tidak ada nama yang terlihat dobel).
 * - Gulir memakai transform translate3d pada grid (dikerjakan GPU, posisi
 *   subpiksel), bukan scrollTop yang dibulatkan ke piksel sehingga tersendat.
 * - Hanya salinan pertama yang memakai animasi layout/masuk/keluar; salinan
 *   loop berikutnya adalah kartu biasa agar tidak mengukur ulang ratusan sel.
 *
 * Semua salinan berada di SATU grid, sehingga sel kosong di baris terakhir
 * langsung terisi item pertama salinan berikutnya. Titik ulang (anchor) adalah
 * item pertama salinan ke-k, k = jumlah salinan terkecil agar susunan kolom
 * kembali sama persis.
 */
export function AutoScrollContainer<T>({
  items,
  getKey,
  renderItem,
  empty,
  itemMotion,
  columns = 2,
  className = "",
  speed = 24,
  pauseOnHover = true,
}: AutoScrollContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const loopKeysRef = useRef<{ first: string | null; anchor: string | null }>({ first: null, anchor: null });
  const isHoveredRef = useRef(false);
  const settleUntilRef = useRef(0);

  // Total salinan daftar di grid (1 = tanpa loop)
  const [copies, setCopies] = useState(1);
  const n = items.length;
  const periodCopies = n > 0 ? columns / gcd(n, columns) : 1;
  const isLooping = copies > 1;
  const firstItemKey = n > 0 ? getKey(items[0]) : null;
  const firstKey = firstItemKey !== null ? `0:${firstItemKey}` : null;
  const anchorKey = firstItemKey !== null ? `${periodCopies}:${firstItemKey}` : null;
  const itemsSignature = items.map(getKey).join("|");

  useEffect(() => {
    loopKeysRef.current = { first: firstKey, anchor: anchorKey };
  }, [firstKey, anchorKey]);

  // Daftar berubah (absen baru / pindah sesi) → beri waktu animasi kartu selesai
  useEffect(() => {
    settleUntilRef.current = performance.now() + SETTLE_MS;
  }, [itemsSignature]);

  // Item teratas berganti (absen terbaru) → gulir kembali ke atas agar kartu baru terlihat
  const resetRef = useRef(false);
  useEffect(() => {
    resetRef.current = true;
  }, [firstItemKey]);

  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Tentukan apakah perlu loop dan berapa salinan yang dibutuhkan
  useEffect(() => {
    let retryId = 0;
    let retries = 0;

    const measure = () => {
      if (n === 0 || isReducedMotion) {
        setCopies(1);
        return;
      }
      const container = containerRef.current;
      const grid = gridRef.current;
      const first = findCell(grid, firstKey);
      if (!container || !grid || !first) {
        // AnimatePresence bisa memasang kartu baru satu render lebih lambat
        if (retries++ < 120) {
          cancelAnimationFrame(retryId);
          retryId = requestAnimationFrame(measure);
        }
        return;
      }

      const containerH = container.clientHeight;
      const rowH = first.offsetHeight;
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
      const rowPitch = rowH + gap;
      if (rowPitch <= 0) return;

      // Tinggi satu salinan daftar; bila muat di container, tampilkan diam
      const listRows = Math.ceil(n / columns);
      const listH = listRows * rowPitch - gap;
      if (listH <= containerH) {
        setCopies(1);
        return;
      }

      // Baris satu periode + baris yang terlihat + cadangan
      const periodRows = (periodCopies * n) / columns;
      const visibleRows = Math.ceil(containerH / rowPitch) + 1;
      const needed = Math.ceil(((periodRows + visibleRows) * columns) / n);
      setCopies(Math.max(periodCopies + 1, needed));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(retryId);
      resizeObserver.disconnect();
    };
  }, [n, columns, periodCopies, firstKey, isReducedMotion]);

  // Gulir kontinu dengan transform (GPU), posisi subpiksel
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (isReducedMotion || !isLooping) {
      grid.style.transform = "";
      return;
    }

    let animId = 0;
    let lastTime = performance.now();
    let position = 0;

    const tick = (now: number) => {
      // Batasi delta agar tidak melompat jauh setelah tab tidak aktif
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { first: fk, anchor: ak } = loopKeysRef.current;
      const first = findCell(gridRef.current, fk);
      const anchor = findCell(gridRef.current, ak);
      const paused = isHoveredRef.current || now < settleUntilRef.current;

      if (first && anchor) {
        // Jarak satu periode diukur di dalam grid (offsetTop tidak terpengaruh transform)
        const loopThreshold = anchor.offsetTop - first.offsetTop;
        if (loopThreshold > 0) {
          if (resetRef.current) {
            resetRef.current = false;
            position = 0;
          }
          if (!paused) position += speed * delta;
          while (position >= loopThreshold) position -= loopThreshold;
          grid.style.transform = `translate3d(0, ${(-position).toFixed(2)}px, 0)`;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      grid.style.transform = "";
    };
  }, [speed, isReducedMotion, isLooping]);

  const totalCopies = n > 0 ? copies : 1;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        if (pauseOnHover) isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        if (pauseOnHover) isHoveredRef.current = false;
      }}
      className={`overflow-hidden ${className}`}
    >
      {n === 0 ? (
        empty
      ) : (
        // Padding agar ring/glow sorotan kartu tidak terpotong oleh overflow container
        <div
          ref={gridRef}
          className="grid gap-3.5 px-1.5 pt-1.5 pb-0.5 will-change-transform"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, idx) => {
              const key = `0:${getKey(item)}`;
              return (
                <motion.div key={key} data-loop-key={idx === 0 ? key : undefined} layout {...itemMotion}>
                  {renderItem(item)}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {/* Salinan loop: kartu biasa tanpa animasi layout */}
          {Array.from({ length: totalCopies - 1 }, (_, i) =>
            items.map((item, idx) => {
              const key = `${i + 1}:${getKey(item)}`;
              return (
                <div key={key} data-loop-key={idx === 0 ? key : undefined} aria-hidden>
                  {renderItem(item)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
