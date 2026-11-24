import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import { formatEventDateRange } from "@/lib/event-settings";
import { getEventSettings } from "@/lib/event-settings-server";

/** Server component: kartu info acara di sheet "Lainnya" navigasi HP, mengikuti event settings (sama dengan hero). */
export async function DrawerEventCard() {
  const settings = await getEventSettings();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground">
      <span aria-hidden="true" className="absolute -top-8 -right-8 size-24 rounded-full bg-brand-gold/25" />
      <p className="relative text-sm font-semibold">{EVENT_INFO.title}</p>
      <ul className="relative mt-2.5 flex flex-col gap-1.5 text-[13px] text-primary-foreground/85">
        <li className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-brand-gold-soft" />
          {formatEventDateRange(settings.startsAt)}
        </li>
        <li className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-gold-soft" />
          <span className="min-w-0 truncate">{settings.venueName}</span>
        </li>
      </ul>
      <a
        href={settings.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Buka lokasi ${settings.venueName} di Google Maps (tab baru)`}
        className="relative mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-background text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      >
        Buka Maps
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}
