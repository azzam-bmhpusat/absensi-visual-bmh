"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

/**
 * Navbar sticky yang memegas dari bar selebar layar menjadi kapsul melayang saat di-scroll.
 * Diadaptasi dari freedesignmd "Floating Capsule Nav": hanya cangkang + animasi pegas;
 * isi (logo, menu, akun) diisi lewat slot. Warna mengikuti token tema proyek.
 * @param brand Slot kiri (logo).
 * @param children Slot tengah (menu desktop).
 * @param actions Slot kanan (akun).
 * @param threshold Jarak scroll (px) sebelum berubah menjadi kapsul.
 * Lebar kapsul = lebar konten section (max-w-[1280px] px-4 sm:px-5 md:px-8).
 */
export function FloatingCapsuleNav({
  brand,
  children,
  actions,
  threshold = 24,
  className,
}: {
  brand: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  threshold?: number;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);

  // Kapsul digerakkan pegas: x = 0 (bar penuh) … 1 (kapsul).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0,
      v = 0,
      target = 0,
      raf = 0,
      last = 0;
    const apply = () => {
      const W = el.clientWidth;
      const mobile = W < 760;
      const gutter = W >= 768 ? 32 : W >= 640 ? 20 : 16;
      const cap = Math.min(W, 1280) - gutter * 2;
      const s = ((W - cap) / 2) * x;
      const pad = mobile ? 16 : 32;
      const capPad = mobile ? 10 : 14;
      const p = Math.min(Math.max(x, 0), 1);
      el.style.setProperty("--fcn-s", `${s.toFixed(2)}px`);
      el.style.setProperty(
        "--fcn-t",
        `${(8 * Math.min(Math.max(x, 0), 1.2)).toFixed(2)}px`,
      );
      el.style.setProperty("--fcn-r", `${(28 * p).toFixed(2)}px`);
      el.style.setProperty(
        "--fcn-dx",
        `${(s + (capPad - pad) * x).toFixed(2)}px`,
      );
      el.style.setProperty("--fcn-p", p.toFixed(3));
    };
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;
      v += (-380 * (x - target) - 30 * v) * dt;
      x += v * dt;
      apply();
      if (Math.abs(v) < 0.002 && Math.abs(x - target) < 0.001) {
        x = target;
        v = 0;
        apply();
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };
    const kick = () => {
      if (reduce) {
        x = target;
        apply();
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    const onScroll = () => {
      const t = window.scrollY > threshold ? 1 : 0;
      if (t !== target) {
        target = t;
        setCompact(t === 1);
        kick();
      }
    };
    target = window.scrollY > threshold ? 1 : 0;
    x = target;
    setCompact(target === 1);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return (
    <header
      ref={root}
      className={cn("fd-fcn", className)}
      data-compact={compact ? "" : undefined}
    >
      <style>{css}</style>
      <div className="fd-fcn-shape" aria-hidden="true">
        <span className="fd-fcn-edge" />
        <span className="fd-fcn-fill" />
      </div>
      <div className="fd-fcn-row">
        <div className="fd-fcn-l">{brand}</div>
        {children ? <div className="fd-fcn-c">{children}</div> : null}
        <div className="fd-fcn-r">{actions}</div>
      </div>
    </header>
  );
}

const css = `
.fd-fcn {
  --fcn-s: 0px; --fcn-t: 0px; --fcn-r: 0px; --fcn-dx: 0px; --fcn-p: 0;
  position: sticky; top: 0; z-index: 50;
  display: block; height: 64px;
}
@media (min-width: 1024px) { .fd-fcn { height: 72px; } }
.fd-fcn-shape {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  filter: drop-shadow(0 calc(var(--fcn-p) * 12px) calc(var(--fcn-p) * 22px) color-mix(in srgb, var(--brand-green-deep) calc(var(--fcn-p) * 22%), transparent));
}
.fd-fcn-edge, .fd-fcn-fill { position: absolute; inset: 0; display: block; }
.fd-fcn-edge {
  background: var(--line);
  clip-path: inset(var(--fcn-t) var(--fcn-s) var(--fcn-t) var(--fcn-s) round var(--fcn-r));
}
.fd-fcn-fill {
  background: color-mix(in srgb, var(--background) 94%, transparent);
  backdrop-filter: blur(12px);
  clip-path: inset(calc(var(--fcn-t) + var(--fcn-p) * 1px) calc(var(--fcn-s) + var(--fcn-p) * 1px) calc(var(--fcn-t) + 1px) calc(var(--fcn-s) + var(--fcn-p) * 1px) round max(0px, calc(var(--fcn-r) - 1px)));
}
.fd-fcn-row { position: relative; z-index: 1; height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; }
@media (min-width: 760px) { .fd-fcn-row { padding: 0 32px; } }
.fd-fcn-l, .fd-fcn-r { position: relative; display: flex; align-items: center; flex-shrink: 0; }
.fd-fcn-l { transform: translateX(var(--fcn-dx)); }
.fd-fcn-r { transform: translateX(calc(var(--fcn-dx) * -1)); }
.fd-fcn-c { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; }
@media (min-width: 1024px) { .fd-fcn-c { display: flex; } }
`;
