import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import { formatEventDateRange } from "@/lib/event-settings";
import { getEventSettings } from "@/lib/event-settings-server";

/** Server component: kartu info acara di sheet "Lainnya" navigasi HP, mengikuti event settings (sama dengan hero). */
export async function DrawerEventCard() {
  const settings = await getEventSettings();
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] bg-linear-to-b from-[#0B6355] to-[#04362F] px-5 pt-[22px] pb-5 text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[28px] border border-transparent [background:linear-gradient(to_bottom,#FFFFFF59,#FFFFFF00)_border-box] [mask:linear-gradient(#000_0_0)_padding-box_exclude,linear-gradient(#000_0_0)_border-box]"
      />
      <span aria-hidden="true" className="absolute -top-7 -right-6 -z-10 size-[110px] rounded-full bg-[#5C7A44D9]" />
      <p className="font-heading text-lg font-semibold">{EVENT_INFO.title}</p>
      <ul className="mt-2.5 flex flex-col gap-2.5 text-base text-white/90">
        <li className="flex items-center gap-2.5">
          <CalendarDays aria-hidden="true" className="size-[18px] shrink-0 text-brand-gold" />
          {formatEventDateRange(settings.startsAt)}
        </li>
        <li className="flex items-center gap-2.5">
          <MapPin aria-hidden="true" className="size-[18px] shrink-0 text-brand-gold" />
          <span className="min-w-0 truncate">{settings.venueName}</span>
        </li>
      </ul>
      <a
        href={settings.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Buka lokasi ${settings.venueName} di Google Maps (tab baru)`}
        className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brand-gold text-base font-semibold text-primary transition-[filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Buka Maps
        <ExternalLink aria-hidden="true" className="size-[18px]" />
      </a>
    </div>
  );
}
