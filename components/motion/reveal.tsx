"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Jeda sebelum animasi mulai (detik). */
  delay?: number;
  /** Jarak geser vertikal awal (px). */
  y?: number;
  /** Jarak geser horizontal awal (px). */
  x?: number;
  /** Mainkan segera saat dimuat, bukan menunggu masuk viewport. */
  immediate?: boolean;
}

/** Fade + geser halus saat elemen masuk viewport (sekali saja). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  x = 0,
  immediate = false,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, x, y };
  const shown = { opacity: 1, x: 0, y: 0 };
  const transition = {
    duration: reduceMotion ? 0.2 : 0.6,
    ease: EASE,
    delay,
  };

  return (
    <motion.div
      className={className}
      initial={hidden}
      {...(immediate
        ? { animate: shown }
        : {
            whileInView: shown,
            viewport: { once: true, amount: 0.1 },
          })}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = (reduceMotion: boolean | null, y: number): Variants => ({
  hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: reduceMotion ? 0.2 : 0.55, ease: EASE },
  },
});

interface RevealStaggerProps {
  children: ReactNode;
  className?: string;
  /** Selisih waktu antar anak (detik). */
  stagger?: number;
  /** Jeda sebelum anak pertama (detik). */
  delay?: number;
  /** Mainkan segera saat dimuat, bukan menunggu masuk viewport. */
  immediate?: boolean;
  role?: string;
  "aria-live"?: "off" | "polite" | "assertive";
}

/** Pembungkus: anak `RevealItem` muncul berurutan. */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  immediate = false,
  role,
  "aria-live": ariaLive,
}: RevealStaggerProps) {
  const variants: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <motion.div
      className={className}
      role={role}
      aria-live={ariaLive}
      variants={variants}
      initial="hidden"
      {...(immediate
        ? { animate: "shown" }
        : { whileInView: "shown", viewport: { once: true, amount: 0.1 } })}
    >
      {children}
    </motion.div>
  );
}

/** Anak dari `RevealStagger`. */
export function RevealItem({
  children,
  className,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={className} variants={itemVariants(reduceMotion, y)}>
      {children}
    </motion.div>
  );
}

/** Pop-in berpegas (skala 0.6 → 1) untuk ikon/penanda keberhasilan. */
export function PopIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : { type: "spring", stiffness: 260, damping: 18, delay }
      }
    >
      {children}
    </motion.div>
  );
}
