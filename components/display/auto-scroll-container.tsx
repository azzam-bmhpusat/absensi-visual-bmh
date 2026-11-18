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
  speed?: number; // pixels per second (default 28)
  pauseOnHover?: boolean; // jeda saat kursor mouse di-hover
}

function findCell(grid: HTMLElement | null, key: string | null) {
  if (!grid || !key) return null;
  return grid.querySelector<HTMLElement>(
    `:scope > [data-loop-key="${CSS.escape(key)}"]`
  );
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
 * Grid yang bergulir terus-menerus (seamless loop).
 *
 * Semua salinan daftar berada di SATU grid, sehingga sel kosong di baris
 * terakhir (jumlah item ganjil) langsung terisi item pertama salinan
 * berikutnya dan jarak antar baris di sambungan sama dengan jarak biasa.
 * Titik ulang (anchor) adalah item pertama dari salinan ke-k, dengan k
 * salinan = jumlah terkecil agar susunan kolom kembali sama persis.
 */
export function AutoScrollContainer<T>({
  items,
  getKey,
  renderItem,
  empty,
  itemMotion,
  columns = 2,
  className = "",
  speed = 28,
  pauseOnHover = true,
}: AutoScrollContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Kunci sel pertama & sel anchor. Node-nya dicari langsung di DOM (lewat
  // data-loop-key) setiap kali dibutuhkan, bukan disimpan lewat ref, karena
  // kartu yang sedang animasi keluar saat pindah sesi bisa meninggalkan ref
  // basi sehingga loop berhenti.
  const loopKeysRef = useRef<{ first: string | null; anchor: string | null }>({
    first: null,
    anchor: null,
  });
  const isHoveredRef = useRef(false);

  // Total salinan daftar di grid (1 = tanpa loop)
  const [copies, setCopies] = useState(1);
  const n = items.length;
  // Jumlah salinan per periode agar posisi kolom kembali sama
  const periodCopies = n > 0 ? columns / gcd(n, columns) : 1;
  const isLooping = copies > periodCopies;
  const firstItemKey = n > 0 ? getKey(items[0]) : null;
  const firstKey = firstItemKey !== null ? `0:${firstItemKey}` : null;
  const anchorKey =
    firstItemKey !== null ? `${periodCopies}:${firstItemKey}` : null;

  useEffect(() => {
    loopKeysRef.current = { first: firstKey, anchor: anchorKey };
  }, [firstKey, anchorKey]);

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
        // (mis. saat pindah sesi). Jangan matikan loop; ukur ulang di frame
        // berikutnya sampai kartu pertama tersedia.
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

      // Selalu loop selama daftar berisi (konsisten di semua sesi & zoom)
      // Baris satu periode + baris yang terlihat di container + cadangan
      const periodRows = (periodCopies * n) / columns;
      const visibleRows = Math.ceil(containerH / rowPitch) + 1;
      const needed = Math.ceil(((periodRows + visibleRows) * columns) / n);
      setCopies(Math.max(periodCopies + 1, needed));
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (gridRef.current) resizeObserver.observe(gridRef.current);

    return () => {
      cancelAnimationFrame(retryId);
      resizeObserver.disconnect();
    };
  }, [n, columns, periodCopies, firstKey, isReducedMotion]);

  // Animasi Continuous Seamless Scroll (Looping Unlimited)
  useEffect(() => {
    if (isReducedMotion || !isLooping) return;

    const el = containerRef.current;
    if (!el) return;

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

      const { first: fk, anchor: ak } = loopKeysRef.current;
      const first = findCell(gridRef.current, fk);
      const anchor = findCell(gridRef.current, ak);

      // Jalankan animasi jika tidak sedang di-pause oleh hover kursor
      if (!isHoveredRef.current && first && anchor) {
        // Jarak satu periode: dari item pertama ke item pertama salinan ke-k.
        // Pakai getBoundingClientRect (subpiksel), bukan offsetTop yang
        // dibulatkan, agar tidak ada lompatan ~0,5 px saat reset.
        const loopThreshold =
          anchor.getBoundingClientRect().top - first.getBoundingClientRect().top;

        if (loopThreshold > 0) {
          // Sinkronkan jika posisi diubah dari luar (mis. scroll manual)
          if (Math.abs(el.scrollTop - position) > 2) {
            position = el.scrollTop;
          }

          position += speed * delta;

          while (position >= loopThreshold) {
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

    return () => cancelAnimationFrame(animId);
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
      className={`overflow-y-auto no-scrollbar ${className}`}
    >
      {n === 0 ? (
        empty
      ) : (
        // Padding agar ring/glow sorotan kartu tidak terpotong oleh overflow container
        <div
          ref={gridRef}
          className="grid gap-3.5 px-1.5 pt-1.5 pb-0.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          <AnimatePresence initial={false}>
            {Array.from({ length: totalCopies }, (_, copy) =>
              items.map((item, idx) => {
                const key = `${copy}:${getKey(item)}`;
                return (
                  <motion.div
                    key={key}
                    data-loop-key={idx === 0 ? key : undefined}
                    aria-hidden={copy > 0 ? true : undefined}
                    layout
                    {...itemMotion}
                  >
                    {renderItem(item)}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
