import { z } from "zod";
import { addCalendarDays, fromWibDateTime, toWibDateTime, type EventSettings } from "@/lib/event-settings";

const httpsUrl = z.string().trim().max(2048, "URL maksimal 2048 karakter.").refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}, "Gunakan URL HTTPS yang valid.");

const coordinate = (min: number, max: number, label: string) => z.string().trim()
  .min(1, `${label} wajib diisi.`)
  .transform(Number)
  .pipe(z.number().finite().min(min, `${label} minimal ${min}.`).max(max, `${label} maksimal ${max}.`));

export const eventSettingsFormSchema = z.object({
  venueName: z.string().trim().min(1, "Nama tempat wajib diisi.").max(200, "Maksimal 200 karakter."),
  venueAddress: z.string().trim().min(1, "Alamat wajib diisi.").max(1000, "Maksimal 1000 karakter."),
  mapsUrl: httpsUrl,
  latitude: coordinate(-90, 90, "Lintang"),
  longitude: coordinate(-180, 180, "Bujur"),
  startsAtLocal: z.string().refine((value) => fromWibDateTime(value) !== null, "Tanggal dan jam mulai tidak valid."),
  endTime: z.string().refine((value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Jam selesai tidak valid."),
  footerUrl: httpsUrl,
}).transform(({ startsAtLocal, endTime, ...fields }): EventSettings => ({
  ...fields,
  startsAt: fromWibDateTime(startsAtLocal)!,
  endsAt: endTime ? fromWibDateTime(`${addCalendarDays(startsAtLocal.slice(0, 10), 2)}T${endTime}`) : null,
}));

export type EventSettingsFormValues = z.input<typeof eventSettingsFormSchema>;
export type EventSettingsFieldErrors = Partial<Record<keyof EventSettingsFormValues, string>>;

export function toEventSettingsForm(settings: EventSettings): EventSettingsFormValues {
  return {
    venueName: settings.venueName, venueAddress: settings.venueAddress,
    mapsUrl: settings.mapsUrl, latitude: String(settings.latitude), longitude: String(settings.longitude),
    startsAtLocal: toWibDateTime(settings.startsAt),
    endTime: settings.endsAt ? toWibDateTime(settings.endsAt).slice(11) : "",
    footerUrl: settings.footerUrl,
  };
}

export function eventSettingsToRow(settings: EventSettings) {
  return {
    venue_name: settings.venueName, venue_address: settings.venueAddress,
    maps_url: settings.mapsUrl, latitude: settings.latitude, longitude: settings.longitude,
    starts_at: settings.startsAt, ends_at: settings.endsAt, footer_url: settings.footerUrl,
  };
}

/** Validate database reads too: corrupt or incomplete rows must not reach the public page. */
export function eventSettingsFromRow(row: Record<string, unknown>): EventSettings | null {
  if (typeof row.starts_at !== "string" || !Number.isFinite(Date.parse(row.starts_at))) return null;
  if (row.ends_at !== null && (typeof row.ends_at !== "string" || !Number.isFinite(Date.parse(row.ends_at)))) return null;
  const start = toWibDateTime(row.starts_at);
  if (row.ends_at && toWibDateTime(row.ends_at as string).slice(0, 10) !== addCalendarDays(start.slice(0, 10), 2)) return null;
  const parsed = eventSettingsFormSchema.safeParse({
    venueName: row.venue_name, venueAddress: row.venue_address, mapsUrl: row.maps_url,
    latitude: row.latitude == null ? "" : String(row.latitude),
    longitude: row.longitude == null ? "" : String(row.longitude),
    startsAtLocal: start, endTime: row.ends_at ? toWibDateTime(row.ends_at as string).slice(11) : "",
    footerUrl: row.footer_url,
  });
  return parsed.success ? parsed.data : null;
}
