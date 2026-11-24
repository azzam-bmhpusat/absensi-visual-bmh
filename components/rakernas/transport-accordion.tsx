"use client";

import { TrainFront, Bus, Plane, Car, Footprints, MapPin, Megaphone } from "lucide-react";
import { cn } from "cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { TRANSPORT_DATA, type TransportItem } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
import { buildTransportDirectionsUrl } from "@/lib/transport-directions";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

function getStopIcon(iconType: TransportItem["icon"]) {
  if (iconType === "train") return TrainFront;
  return iconType === "plane" ? Plane : Bus;
}

export function TransportSection({
  venueName = TRANSPORT_DATA.destination.name,
  footerUrl = DEFAULT_EVENT_SETTINGS.footerUrl,
}: { venueName?: string; footerUrl?: string } = {}) {
  const { announcement } = TRANSPORT_DATA;
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Kolom Kiri: Judul & Subjudul (Sticky di layar besar) */}
        <Reveal x={-24} y={0} className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{TRANSPORT_DATA.badge}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary tracking-tight">
            {TRANSPORT_DATA.title}
          </h2>
          <p className="text-base md:text-lg text-ink-muted leading-relaxed">
            {TRANSPORT_DATA.subtitle}{" "}
            <span className="font-semibold text-ink">{venueName}</span>
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            {TRANSPORT_DATA.description}
          </p>
          <p className="text-xs text-ink-muted leading-relaxed">
            {TRANSPORT_DATA.travelNote}
          </p>
          <p className="text-xs text-ink-muted leading-relaxed">
            {TRANSPORT_DATA.fareNote}
          </p>
        </Reveal>

        {/* Kolom Kanan: pemberhentian lokal, bandara, dan rute menuju hotel */}
        <RevealStagger className="lg:col-span-7" stagger={0.07}>
          <Accordion
            defaultValue={["origin-0"]}
            className="w-full space-y-3"
          >
            {TRANSPORT_DATA.items.map((item, index) => {
              const Icon = getStopIcon(item.icon);
              const value = `origin-${index}`;
              const isDriving = item.travelMode === "driving";
              const RouteIcon = isDriving ? Car : Footprints;
              const routeLabel = isDriving ? TRANSPORT_DATA.drivingLinkLabel : TRANSPORT_DATA.walkingLinkLabel;

              return (
                <RevealItem key={item.name} y={16}>
                <AccordionItem
                  value={value}
                  className="rounded-2xl border border-line bg-card shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)] px-5 md:px-6 transition-all data-open:border-primary/40 data-open:shadow-md"
                >
                  <AccordionTrigger className="items-center py-4 hover:no-underline gap-4 text-left font-heading font-semibold text-ink text-base md:text-lg min-h-[44px]">
                    <div className="flex min-w-0 items-center gap-3.5 flex-1">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-heading font-semibold text-ink text-base md:text-lg">
                          {item.name}
                        </span>
                        <span className="text-xs md:text-sm font-normal text-ink-muted tabular-nums">
                          {item.accessInfo}
                        </span>
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <p className="text-sm leading-relaxed text-ink-muted md:text-base">{item.description}</p>
                    <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-secondary/40 px-4 text-sm">
                      <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-ink-muted">Jarak ke hotel</dt>
                        <dd className="min-w-0 leading-relaxed text-ink">{item.distanceInfo}</dd>
                      </div>
                      <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-ink-muted">Moda yang cocok</dt>
                        <dd className="min-w-0 text-ink">{item.transportMode}</dd>
                      </div>
                      <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-ink-muted">Estimasi harga</dt>
                        <dd className="min-w-0 font-semibold text-primary tabular-nums">{item.estimatedFare}</dd>
                      </div>
                    </dl>
                    <a
                      href={buildTransportDirectionsUrl(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${isDriving ? "Rute berkendara" : "Jalan kaki"} dari ${item.name} ke ${TRANSPORT_DATA.destination.name} di Google Maps`}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "mt-4 h-auto min-h-11 w-full gap-2 whitespace-normal rounded-xl border-line bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-secondary sm:w-auto",
                      )}
                    >
                      <RouteIcon className="size-4 shrink-0" aria-hidden="true" />
                      {routeLabel}
                    </a>
                  </AccordionContent>
                </AccordionItem>
                </RevealItem>
              );
            })}
          </Accordion>
        </RevealStagger>
      </div>

      {/* Pengumuman di bagian paling bawah: tempat transit H-1 */}
      <Reveal y={16} className="mt-8 md:mt-12">
        <div
          role="note"
          className="flex flex-col gap-4 rounded-2xl border border-brand-gold/40 bg-gold-50 p-5 md:flex-row md:items-center md:justify-between md:p-6"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-brand-gold-text">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="pt-1.5 text-sm md:text-base leading-relaxed text-ink">
              {announcement.text}
              <a
                href={footerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-4 transition-colors hover:text-brand-green-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                {announcement.linkLabel}
              </a>
              .
            </p>
          </div>
          <a
            href={announcement.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka lokasi Guest House YPPH Depok di Google Maps"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 shrink-0 gap-2 rounded-xl border-brand-gold/50 bg-white px-5 text-sm font-semibold text-primary hover:bg-secondary"
            )}
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {announcement.mapsLabel}
          </a>
        </div>
      </Reveal>
    </div>
  );
}
