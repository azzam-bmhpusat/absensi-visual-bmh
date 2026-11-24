"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const card: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE, staggerChildren: 0.06, delayChildren: 0.1 },
  },
  exit: { opacity: 0, y: -14, scale: 0.98, filter: "blur(4px)", transition: { duration: 0.2, ease: EASE } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Animasi kartu login. `transitionKey` = halaman tujuan (?next=): saat pengguna berpindah dari
 * satu halaman wajib-login ke halaman lain, kartu lama keluar lalu kartu baru masuk.
 * Pengguna dengan "reduce motion" hanya mendapat fade.
 */
export function LoginTransition({ transitionKey, children }: { transitionKey: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={reduceMotion ? fade : card}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Bagian kartu yang muncul bertahap mengikuti LoginTransition. */
export function LoginTransitionItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div variants={reduceMotion ? undefined : item} className={className}>
      {children}
    </motion.div>
  );
}
