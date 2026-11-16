import type { Metadata } from "next";
import { SITE_METADATA, INVITED_GUESTS_CONTENT } from "@/content/rakernas";
import { SiteHeader } from "@/components/rakernas/site-header";
import { HeroSection } from "@/components/rakernas/hero";
import { CountdownSection } from "@/components/rakernas/countdown";
import { RundownSection } from "@/components/rakernas/rundown-tabs";
import { DresscodeSection } from "@/components/rakernas/dresscode-carousel";
import { LocationSection } from "@/components/rakernas/location-section";
import { TransportSection } from "@/components/rakernas/transport-accordion";
import { InvitedGuestsSection } from "@/components/rakernas/invited-guests-section";
import { SiteFooter } from "@/components/rakernas/site-footer";

export const metadata: Metadata = {
  title: {
    absolute: SITE_METADATA.title,
  },
  description: SITE_METADATA.description,
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* S0 — Header (Sticky) */}
      <SiteHeader />

      <main className="flex-1 w-full overflow-x-hidden">
        {/* S1 — Hero minimalis dengan tema terang */}
        <HeroSection />

        {/* S2 — Hitung Mundur dengan tema gelap */}
        <section
          id="countdown"
          className="display-theme display-bg text-foreground scroll-mt-20 border-t border-line/10 py-10 md:py-16"
          aria-label="Hitung Mundur Acara"
        >
          <CountdownSection />
        </section>

        {/* S3 — Rundown Acara */}
        <section
          id="rundown"
          className="page-bg scroll-mt-20 py-12 md:py-20"
          aria-label="Rundown Acara"
        >
          <RundownSection />
        </section>

        {/* S4 — Dress Code */}
        <section
          id="dresscode"
          className="bg-secondary scroll-mt-20 py-12 md:py-20"
          aria-label="Dress Code"
        >
          <DresscodeSection />
        </section>

        {/* S5 — Lokasi Rakernas */}
        <section
          id="lokasi"
          className="bg-background scroll-mt-20 py-12 md:py-20"
          aria-label="Lokasi Rakernas"
        >
          <LocationSection />
        </section>

        {/* S6 — Info Transportasi */}
        <section
          id="transportasi"
          className="bg-surface scroll-mt-20 py-12 md:py-20"
          aria-label="Info Transportasi"
        >
          <TransportSection />
        </section>

        {/* S7 — Pencarian Tamu Undangan */}
        <section
          id="tamu-undangan"
          className="display-theme display-bg scroll-mt-20 py-12 md:py-20 text-foreground"
          aria-label={INVITED_GUESTS_CONTENT.title}
        >
          <InvitedGuestsSection />
        </section>
      </main>

      {/* S8 — Footer */}
      <SiteFooter className="bg-brand-green-night" />
    </div>
  );
}
