import Image from "next/image";
import type { LucideIcon } from "lucide-react";

type Stat = { icon: LucideIcon; value: number; label: string };

/** Header halaman bergambar: foto latar, badge, judul, deskripsi, dan statistik opsional. */
export function PageHero({
  title,
  badge,
  description,
  image,
  stats,
}: {
  title: string;
  badge: { icon: LucideIcon; label: string };
  description: string;
  image: string;
  stats?: Stat[];
}) {
  const BadgeIcon = badge.icon;
  return (
    <header className="relative isolate overflow-hidden rounded-3xl bg-brand-green-deep text-white shadow-lg">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-green-night/95 via-brand-green-deep/85 to-brand-green-deep/40"
      />
      <div className="flex flex-col gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-10">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold-soft/90 px-3 py-1 text-xs font-semibold text-brand-green-deep">
            <BadgeIcon className="size-3.5" aria-hidden />
            {badge.label}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/80 md:text-base">{description}</p>
        </div>

        {stats && stats.length > 0 && (
          <dl className="grid grid-cols-3 gap-3 md:gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm md:min-w-24"
              >
                <Icon className="size-4 text-brand-gold-soft" aria-hidden />
                <dt className="order-last text-xs text-white/70">{label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
