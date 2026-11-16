import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/server";
import { DEFAULT_EVENT_SETTINGS, EVENT_SETTINGS_CACHE_TAG, type EventSettings } from "@/lib/event-settings";
import { eventSettingsFromRow } from "@/lib/event-settings-validation";

export const EVENT_SETTINGS_COLUMNS = "venue_name,venue_address,maps_url,latitude,longitude,starts_at,ends_at,footer_url,updated_at";
export const SETTINGS_LOAD_ERROR = "Pengaturan acara belum dapat dimuat. Pastikan migrasi 0005_event_settings.sql telah diterapkan, lalu muat ulang halaman.";

export async function readEventSettings(): Promise<{ settings: EventSettings; error: string | null }> {
  try {
    const { data, error } = await createPublicServerClient().from("event_settings")
      .select(EVENT_SETTINGS_COLUMNS).eq("id", 1).single();
    const settings = !error && data ? eventSettingsFromRow(data) : null;
    if (settings) return { settings, error: null };
  } catch { /* Beranda tetap tersedia ketika database tidak dapat dihubungi. */ }
  return { settings: DEFAULT_EVENT_SETTINGS, error: SETTINGS_LOAD_ERROR };
}

export async function getEventSettings(): Promise<EventSettings> {
  "use cache";
  cacheTag(EVENT_SETTINGS_CACHE_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return (await readEventSettings()).settings;
}
