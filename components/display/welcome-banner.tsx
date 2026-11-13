"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface WelcomeItem {
  id: string;
  nama: string;
  daerah: string;
}

interface WelcomeBannerProps {
  queue: WelcomeItem[];
  onDismiss: (id: string) => void;
}

export function WelcomeBanner({ queue, onDismiss }: WelcomeBannerProps) {
  const currentItem = queue.length > 0 ? queue[0] : null;

  useEffect(() => {
    if (!currentItem) return;

    const timer = setTimeout(() => {
      onDismiss(currentItem.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentItem, onDismiss]);

  return (
    <div className="relative min-h-[76px] w-full flex items-center justify-center my-1 z-20">
      <AnimatePresence mode="wait">
        {currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full rounded-2xl bg-brand-gold-soft text-[#0A3A30] py-3.5 px-6 text-center font-heading text-2xl xl:text-3xl font-bold shadow-xl border border-white/20 flex items-center justify-center gap-2"
          >
            <span>Selamat datang,</span>
            <span className="underline decoration-2 underline-offset-4 font-extrabold">
              {currentItem.nama}
            </span>
            <span className="text-xl xl:text-2xl font-semibold opacity-90">
              — {currentItem.daerah}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
