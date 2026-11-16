import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import styles from "./hero.module.css";

export function HeroSection() {
  const titleParts = EVENT_INFO.title.match(/^(.*)\s+(\S+)\s+(\d{4})$/);
  const dateDays = EVENT_INFO.dateDays.replace(/\s*-\s*/, "–");

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
                {dateDays} {EVENT_INFO.dateMonthYear}
              </p>
            </div>
          </div>
          <div className={styles.detail}>
            <span className={styles.icon} aria-hidden="true">
              <MapPin />
            </span>
            <div>
              <p className={styles.label}>Lokasi acara</p>
              <p className={styles.value}>{EVENT_INFO.hotel}</p>
            </div>
          </div>
        </div>

        <a
          className={styles.button}
          href={EVENT_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Lihat lokasi ${EVENT_INFO.hotel} di Google Maps (tab baru)`}
        >
          Lihat lokasi acara
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
