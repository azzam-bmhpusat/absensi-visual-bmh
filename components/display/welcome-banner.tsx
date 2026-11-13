"use client";

interface WelcomeBannerProps {
  nama: string;
  daerah: string;
}

export function WelcomeBanner({ nama, daerah }: WelcomeBannerProps) {
  return (
    <div className="w-full rounded-2xl bg-brand-gold-soft text-[#0A3A30] p-4 text-center font-heading text-2xl font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
      Selamat datang, <span className="underline">{nama}</span> — {daerah}
    </div>
  );
}
