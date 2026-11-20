import type { Metadata } from "next";
import { EVENT_INFO, SITE_METADATA, INVITED_GUESTS_CONTENT } from "@/content/rakernas";
import { HeroSection } from "@/components/rakernas/hero";
import { CountdownSection } from "@/components/rakernas/countdown";
import { RundownSection } from "@/components/rakernas/rundown-tabs";
import { DresscodeSection } from "@/components/rakernas/dresscode-carousel";
import { LocationSection } from "@/components/rakernas/location-section";
import { TransportSection } from "@/components/rakernas/transport-accordion";
import { InvitedGuestsSection } from "@/components/rakernas/invited-guests-section";
import { SiteFooter } from "@/components/rakernas/site-footer";
import { Reveal } from "@/components/motion/reveal";
import { getEventSettings } from "@/lib/event-settings-server";
import { formatEventDateRange } from "@/lib/event-settings";
import { buildSocialMetadata } from "@/lib/og-metadata";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getEventSettings();
  return {
    title: {
      absolute: SITE_METADATA.title,
    },
    description: `${EVENT_INFO.title}. ${formatEventDateRange(settings.startsAt)} di ${settings.venueName}. ${settings.venueAddress}`,
    // Preview link: hanya judul + tema (tanpa tanggal/lokasi)
    ...buildSocialMetadata({ path: "/" }),
  };
}

export default async function HomePage() {
  const settings = await getEventSettings();
  return (
    <>
      {/* S0 — Header (Sticky) ada di app/(site)/layout.tsx */}
      <main className="flex-1 w-full overflow-x-hidden">
        {/* S1 — Hero minimalis dengan tema terang */}
        <HeroSection settings={settings} />

        {/* S2 — Hitung Mundur dengan tema gelap */}
        <section
          id="countdown"
          className="display-theme display-bg text-foreground scroll-mt-20 border-t border-line/10 py-10 md:py-16"
          aria-label="Hitung Mundur Acara"
        >
          <Reveal><CountdownSection target={settings.startsAt} endsAt={settings.endsAt} /></Reveal>
        </section>

        {/* S3 — Rundown Acara */}
        <section
          id="rundown"
          className="page-bg scroll-mt-20 py-12 md:py-20"
          aria-label="Rundown Acara"
        >
          <Reveal><RundownSection startsAt={settings.startsAt} /></Reveal>
        </section>

        {/* S4 — Dress Code */}
        <section
          id="dresscode"
          className="bg-secondary scroll-mt-20 py-12 md:py-20"
          aria-label="Dress Code"
        >
          <Reveal><DresscodeSection /></Reveal>
        </section>

        {/* S5 — Lokasi Rakernas */}
        <section
          id="lokasi"
          className="bg-background scroll-mt-20 py-12 md:py-20"
          aria-label="Lokasi Rakernas"
        >
          <Reveal><LocationSection settings={settings} /></Reveal>
        </section>

        {/* S6 — Info Transportasi */}
        <section
          id="transportasi"
          className="bg-surface scroll-mt-20 py-12 md:py-20"
          aria-label="Info Transportasi"
        >
          <Reveal><TransportSection venueName={settings.venueName} /></Reveal>
        </section>

        {/* S7 — Pencarian Tamu Undangan */}
        <section
          id="tamu-undangan"
          className="display-theme display-bg scroll-mt-20 py-12 md:py-20 text-foreground"
          aria-label={INVITED_GUESTS_CONTENT.title}
        >
          <Reveal><InvitedGuestsSection /></Reveal>
        </section>
      </main>

      {/* S8 — Footer */}
      <SiteFooter className="bg-brand-green-night" settings={settings} />
    </>
  );
}
