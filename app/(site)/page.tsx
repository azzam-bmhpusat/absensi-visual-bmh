import type { Metadata } from "next";
import Image from "next/image";
import { EVENT_INFO, SITE_METADATA, INVITED_GUESTS_CONTENT, HADROH_TEAM } from "@/content/rakernas";
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
      <main className="flex-1 w-full overflow-x-clip">
        {/* S1 — Hero minimalis dengan tema terang */}
        <HeroSection settings={settings} />

        {/* S2 — Hitung Mundur dengan tema gelap */}
        <section
          id="countdown"
          className="bg-[#F4F8F7] scroll-mt-20 py-11 lg:py-[88px]"
          aria-label="Hitung Mundur Acara"
        >
          <Reveal><CountdownSection target={settings.startsAt} endsAt={settings.endsAt} /></Reveal>
        </section>

        {/* S3 — Rundown Acara */}
        <section
          id="rundown"
          className="bg-white scroll-mt-20 py-14 lg:py-[104px]"
          aria-label="Rundown Acara"
        >
          <Reveal><RundownSection startsAt={settings.startsAt} /></Reveal>
        </section>

        {/* S3b — Tim Hadroh */}
        <section
          id="hadroh"
          className="bg-[#F4F8F7] scroll-mt-20 py-14 lg:py-[88px]"
          aria-label={HADROH_TEAM.title}
        >
          <Reveal>
            <div className="site-container flex flex-col gap-5 md:flex-row md:items-center md:gap-10 lg:gap-14">
              <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[20px] md:h-[260px] md:w-[46%] lg:h-[300px] lg:w-[440px] lg:rounded-3xl">
                <Image
                  src="/rakernas/tim-hadroh-shoutul-hidayah.webp"
                  alt="Ilustrasi tim hadroh santri sedang tampil dengan rebana"
                  fill
                  sizes="(min-width: 1024px) 440px, (min-width: 768px) 46vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 lg:gap-3.5">
                <p className="text-[11px] font-semibold tracking-[2px] text-[#1E7F62] uppercase lg:text-xs lg:tracking-[2.4px]">
                  Pengisi Acara
                </p>
                <h2 className="font-heading text-[28px] font-bold text-primary lg:text-[40px]">{HADROH_TEAM.title}</h2>
                <p className="font-heading text-lg font-semibold text-[#9A6A12] lg:text-2xl">{HADROH_TEAM.name}</p>
                <p className="text-[15px]/6 text-[#4F7A72] lg:text-[17px]/[27px]">{HADROH_TEAM.description}</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* S4 — Dress Code */}
        <section
          id="dresscode"
          className="bg-white scroll-mt-20 py-12 lg:py-[120px]"
          aria-label="Dress Code"
        >
          <Reveal><DresscodeSection /></Reveal>
        </section>

        {/* S5 — Lokasi Rakernas */}
        <section
          id="lokasi"
          className="bg-[#F4F8F7] scroll-mt-20 py-14 lg:py-[104px]"
          aria-label="Lokasi Rakernas"
        >
          <Reveal><LocationSection settings={settings} /></Reveal>
        </section>

        {/* S6 — Info Transportasi */}
        <section
          id="transportasi"
          className="relative overflow-hidden bg-[#F4F8F7] scroll-mt-20 py-14 lg:py-[104px]"
          aria-label="Info Transportasi"
        >
          <Reveal><TransportSection venueName={settings.venueName} venueAddress={settings.venueAddress} mapsUrl={settings.mapsUrl} footerUrl={settings.footerUrl} /></Reveal>
        </section>

        {/* S7 — Pencarian Tamu Undangan */}
        <section
          id="tamu-undangan"
          className="bg-[#F4F8F7] scroll-mt-20 py-14 lg:py-[104px]"
          aria-label={INVITED_GUESTS_CONTENT.title}
        >
          <Reveal><InvitedGuestsSection /></Reveal>
        </section>
      </main>

      {/* S8 — Footer */}
      <SiteFooter
        contentClassName="pt-14 lg:pt-20 lg:pb-9"
        settings={settings}
      />
    </>
  );
}
