import { EVENT_INFO, FOOTER_DATA, LOCATION_DATA } from "@/content/rakernas";

export interface EventSettings {
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string | null;
  footerUrl: string;
}

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  venueName: EVENT_INFO.hotel,
  venueAddress: EVENT_INFO.address,
  mapsUrl: EVENT_INFO.mapsUrl,
  latitude: LOCATION_DATA.map.coordinates[1],
  longitude: LOCATION_DATA.map.coordinates[0],
  startsAt: EVENT_INFO.countdownTarget,
  endsAt: null,
  footerUrl: FOOTER_DATA.committee.url,
};

export const EVENT_SETTINGS_CACHE_TAG = "event-settings";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** ISO calendar fields in WIB, independent of the browser/server timezone. */
export function toWibDateTime(instant: string | number | Date): string {
  const timestamp = new Date(instant).getTime();
  return Number.isFinite(timestamp)
    ? new Date(timestamp + WIB_OFFSET_MS).toISOString().slice(0, 16)
    : "";
}

export function addCalendarDays(date: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) return "";
  return new Date(timestamp + days * 86_400_000).toISOString().slice(0, 10);
}

/** Reject invalid calendar dates rather than letting Date silently roll them over. */
export function fromWibDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  // Reserve room for all three event days and avoid PostgreSQL's invalid year zero.
  const year = Number(value.slice(0, 4));
  if (year < 1 || year > 9998) return null;
  const timestamp = Date.parse(`${value}:00+07:00`);
  if (!Number.isFinite(timestamp) || toWibDateTime(timestamp) !== value) return null;
  return new Date(timestamp).toISOString();
}

export function getEventDays(startsAt: string): string[] {
  const firstDay = toWibDateTime(startsAt).slice(0, 10);
  return [0, 1, 2].map((offset) => addCalendarDays(firstDay, offset));
}

export function formatEventDay(date: string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "long", year: "numeric", ...options,
  }).format(new Date(`${date}T12:00:00+07:00`));
}

export function formatEventDateRange(startsAt: string): string {
  const [first, , last] = getEventDays(startsAt);
  if (first.slice(0, 7) === last.slice(0, 7)) {
    return `${first.slice(8)}–${formatEventDay(last)}`;
  }
  const firstOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long" };
  if (first.slice(0, 4) === last.slice(0, 4)) {
    return `${new Intl.DateTimeFormat("id-ID", { ...firstOptions, timeZone: "Asia/Jakarta" }).format(new Date(`${first}T12:00:00+07:00`))}–${formatEventDay(last)}`;
  }
  return `${formatEventDay(first)}–${formatEventDay(last)}`;
}

export function formatEventOpening(startsAt: string): string {
  const local = toWibDateTime(startsAt);
  return `${formatEventDay(local.slice(0, 10))}, ${local.slice(11).replace(":", ".")} WIB`;
}

export function getEventStatus(settings: Pick<EventSettings, "startsAt" | "endsAt">, now: number) {
  if (settings.endsAt && now >= Date.parse(settings.endsAt)) return "finished";
  return now >= Date.parse(settings.startsAt) ? "started" : "upcoming";
}

export function getEventSummary(settings: EventSettings): string {
  return `${formatEventDateRange(settings.startsAt)} | ${settings.venueName}`;
}
