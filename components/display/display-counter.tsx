"use client";

interface DisplayCounterProps {
  hadir: number;
  total: number;
  percentage: number;
}

export function DisplayCounter({ hadir, total, percentage }: DisplayCounterProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <section className="py-2 xl:py-2.5 space-y-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5 xl:gap-3.5">
          <span className="text-xs xl:text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Hadir:
          </span>
          <span className="text-3xl xl:text-5xl font-heading font-bold text-brand-gold-soft leading-none">
            {hadir}
          </span>
          <span className="text-lg xl:text-2xl text-muted-foreground font-semibold">
            / {total} Tamu
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xs xl:text-sm font-medium text-muted-foreground">
            Tingkat Kehadiran:
          </span>
          <span className="text-xl xl:text-3xl font-heading font-bold text-brand-green leading-none">
            {clampedPercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar Ramping (h-2) agar ruang daftar hadir lebih luas */}
      <div className="w-full h-2 xl:h-2.5 bg-[#095046] rounded-full overflow-hidden border border-[#1F6252]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-green to-[#7ADBB2] transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </section>
  );
}
