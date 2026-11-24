import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { ArrowUpRight, CalendarDays, MapPin, MessageCircle } from "lucide-react";
import { EVENT_INFO, EVENT_THEME, FOOTER_DATA, NAV_MENU, type NavItem } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, formatEventDateRange, type EventSettings } from "@/lib/event-settings";

/** Tautan footer: grup Publikasi dibuka jadi anak-anaknya; "#section" menuju beranda. */
const FOOTER_LINKS: NavItem[] = NAV_MENU.flatMap((entry) => (entry.children ? entry.children : [entry])).map(
  (item) => ({ ...item, href: item.href.startsWith("#") ? `/${item.href}` : item.href }),
);

const headingLabel = "text-[11px] font-semibold tracking-[0.16em] text-brand-gold-soft uppercase";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-green-night";

const yearOf = (instant: string) =>
  new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(instant));

/** @param showNav false untuk halaman tanpa navigasi situs (mis. /form). */
export function SiteFooter({
  className,
  contentClassName,
  settings = DEFAULT_EVENT_SETTINGS,
  showNav = true,
}: { className?: string; contentClassName?: string; settings?: EventSettings; showNav?: boolean } = {}) {
  return (
    <footer
      id="footer"
      className={cn("relative isolate overflow-hidden bg-brand-green-night text-white", className)}
    >
      {/* Dekorasi: garis emas di tepi atas + glow lembut */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-gold to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-brand-green/25 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 -z-10 size-80 rounded-full bg-brand-gold/10 blur-3xl"
      />

      <div className={cn("mx-auto w-full max-w-screen-xl px-5 pt-14 pb-28 md:px-8 md:pt-16 md:pb-10", contentClassName)}>
        <div className="grid gap-10 md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-5">
            <Link
              href="/"
              aria-label={`${EVENT_INFO.name} — kembali ke beranda`}
              className={cn("relative inline-flex h-12 w-30 rounded-md transition-opacity hover:opacity-90", focusRing)}
            >
              {/* Pangkas ruang transparan vertikal agar logo putih-emas tetap terbaca. */}
              <Image
                src={FOOTER_DATA.logoSrc}
                alt={FOOTER_DATA.logoAlt}
                fill
                sizes="120px"
                className="object-cover object-[50%_51%]"
              />
            </Link>
            <p className="mt-5 font-heading text-xl font-semibold tracking-tight text-balance md:text-2xl">
              {EVENT_INFO.title}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-pretty text-white/70">{EVENT_THEME}</p>
          </div>

          {/* Navigasi */}
          {showNav && (
            <nav aria-label="Navigasi footer" className="lg:col-span-3">
              <p className={headingLabel}>Navigasi</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 md:grid-cols-1">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group inline-flex min-h-11 items-center rounded-md text-sm text-white/80 transition-colors hover:text-white md:min-h-9",
                        focusRing,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-px w-0 bg-brand-gold transition-all duration-200 group-hover:mr-1.5 group-hover:w-3"
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Informasi acara */}
          <div className={showNav ? "lg:col-span-4" : "md:col-span-2 lg:col-span-7"}>
            <p className={headingLabel}>Informasi Acara</p>
            <ul className="mt-4 flex flex-col gap-4 text-sm">
              <li className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold-soft">
                  <CalendarDays aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="self-center font-medium">{formatEventDateRange(settings.startsAt)}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-gold-soft">
                  <MapPin aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{settings.venueName}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{settings.venueAddress}</span>
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row md:flex-col xl:flex-row">
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Lihat lokasi ${settings.venueName} di Google Maps (tab baru)`}
                className={cn(
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 text-sm font-semibold text-brand-green-night transition-colors hover:bg-brand-gold-soft",
                  focusRing,
                )}
              >
                Lihat Maps
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
              <a
                href={settings.footerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Hubungi ${FOOTER_DATA.committee.label} (tab baru)`}
                className={cn(
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10",
                  focusRing,
                )}
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Hubungi Panitia
              </a>
            </div>
          </div>
        </div>

        {/* Bar bawah */}
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between md:pr-20">
          <p>
            © {yearOf(settings.startsAt)} {EVENT_INFO.name}. Seluruh hak cipta dilindungi. ·{" "}
            <Link
              href="/kebijakan-privasi"
              className={cn("rounded font-medium text-white/80 underline-offset-4 hover:text-white hover:underline", focusRing)}
            >
              Kebijakan Privasi
            </Link>
          </p>
          <p>
            Diselenggarakan oleh{" "}
            <a
              href={settings.footerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("rounded font-medium text-brand-gold-soft underline-offset-4 hover:text-white hover:underline", focusRing)}
            >
              {FOOTER_DATA.committee.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
