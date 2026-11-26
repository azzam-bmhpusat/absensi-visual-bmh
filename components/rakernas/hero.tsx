import { ArrowUpRight, CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { EVENT_INFO } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, formatEventDateRange, type EventSettings } from "@/lib/event-settings";
import { splitEventTitle } from "@/lib/event-title";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";
import styles from "./hero.module.css";

export function HeroSection({ settings = DEFAULT_EVENT_SETTINGS }: { settings?: EventSettings } = {}) {
  const titleParts = splitEventTitle(EVENT_INFO.title);

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <RevealStagger immediate stagger={0.07} className={styles.wrap}>
        <RevealItem>
          <p className={styles.eyebrow}>{EVENT_INFO.name} {titleParts?.year}</p>
        </RevealItem>

        <RevealItem>
        <h1 className={styles.title} id="hero-title">
          {titleParts ? (
            <>
              {titleParts.lead}{" "}
              <span className={styles.titleLine}>
                {titleParts.word}{" "}
                <span className={styles.year}>{titleParts.year}</span>
              </span>
            </>
          ) : (
            EVENT_INFO.title
          )}
        </h1>
        </RevealItem>

        <RevealItem>
          <p className={styles.theme}>{EVENT_INFO.theme}</p>
        </RevealItem>

        <RevealItem>
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
        </RevealItem>

        <RevealItem>
        <div className={styles.buttons}>
          <a
            className={`${styles.button} ${styles.buttonPrimary}`}
            href={settings.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Lihat lokasi ${settings.venueName} di Google Maps (tab baru)`}
          >
            Lihat lokasi acara
            <span className={styles.buttonIcon} aria-hidden="true">
              <ArrowUpRight />
            </span>
          </a>
          <a
            className={`${styles.button} ${styles.buttonOutline}`}
            href="#countdown"
            aria-label="Scroll ke informasi acara"
          >
            Informasi Acara
            <span className={styles.buttonIcon} aria-hidden="true">
              <ChevronDown />
            </span>
          </a>
        </div>
        </RevealItem>
      </RevealStagger>
    </section>
  );
}
