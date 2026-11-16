import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, formatEventDateRange, type EventSettings } from "@/lib/event-settings";
import styles from "./hero.module.css";

export function HeroSection({ settings = DEFAULT_EVENT_SETTINGS }: { settings?: EventSettings } = {}) {
  const titleParts = EVENT_INFO.title.match(/^(.*)\s+(\S+)\s+(\d{4})$/);

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>{EVENT_INFO.name}</p>

        <h1 className={styles.title} id="hero-title">
          {titleParts ? (
            <>
              {titleParts[1]}{" "}
              <span className={styles.titleLine}>
                {titleParts[2]}{" "}
                <span className={styles.year}>{titleParts[3]}</span>
              </span>
            </>
          ) : (
            EVENT_INFO.title
          )}
        </h1>

        <p className={styles.theme}>{EVENT_INFO.theme}</p>

        <div className={styles.details}>
          <div className={styles.detail}>
            <span className={styles.icon} aria-hidden="true">
              <CalendarDays />
            </span>
            <div>
              <p className={styles.label}>Tanggal acara</p>
              <p className={styles.value}>
                {formatEventDateRange(settings.startsAt)}
              </p>
            </div>
          </div>
          <div className={styles.detail}>
            <span className={styles.icon} aria-hidden="true">
              <MapPin />
            </span>
            <div>
              <p className={styles.label}>Lokasi acara</p>
              <p className={styles.value}>{settings.venueName}</p>
            </div>
          </div>
        </div>

        <a
          className={styles.button}
          href={settings.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Lihat lokasi ${settings.venueName} di Google Maps (tab baru)`}
        >
          Lihat lokasi acara
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
