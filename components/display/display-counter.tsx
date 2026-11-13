"use client";

interface DisplayCounterProps {
  hadir: number;
  total: number;
  percentage: number;
}

export function DisplayCounter({ hadir, total, percentage }: DisplayCounterProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <section className="py-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <span className="text-xl font-semibold tracking-wider text-muted-foreground uppercase">
            Hadir
          </span>
          <span className="text-7xl xl:text-8xl font-heading font-bold text-brand-gold-soft leading-none">
            {hadir}
          </span>
          <span className="text-3xl xl:text-4xl text-muted-foreground font-semibold">
            / {total}
          </span>
        </div>
        <div className="text-3xl xl:text-4xl font-heading font-bold text-brand-green">
          {clampedPercentage}%
        </div>
      </div>

      {/* Progress Bar kustom sesuai design-system (trek #134B40, gradasi green-500 -> green-300) */}
      <div className="w-full h-4 bg-[#134B40] rounded-full overflow-hidden p-0.5 border border-[#1F6252]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-green to-[#7ADBB2] transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </section>
  );
}
