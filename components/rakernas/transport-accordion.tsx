"use client";

import { Plane, TrainFront, Bus, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TRANSPORT_DATA, EVENT_INFO } from "@/content/rakernas";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

function getOriginIcon(iconType: "plane" | "train" | "bus") {
  switch (iconType) {
    case "plane":
      return Plane;
    case "train":
      return TrainFront;
    case "bus":
      return Bus;
    default:
      return MapPin;
  }
}

export function TransportSection({ venueName = EVENT_INFO.hotel }: { venueName?: string } = {}) {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Kolom Kiri: Judul & Subjudul (Sticky di layar besar) */}
        <Reveal x={-24} y={0} className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Panduan Rute & Tarif</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary tracking-tight">
            {TRANSPORT_DATA.title}
          </h2>
          <p className="text-base md:text-lg text-ink-muted leading-relaxed">
            menuju{" "}
            <span className="font-semibold text-ink">{venueName}</span>
          </p>
          <p className="text-sm text-ink-muted leading-relaxed hidden sm:block">
            Perkiraan tarif moda transportasi umum dari berbagai titik kedatangan
            utama (Bandara, Stasiun, dan Terminal) menuju ke lokasi acara.
          </p>
        </Reveal>

        {/* Kolom Kanan: Accordion 6 Titik Asal */}
        <RevealStagger className="lg:col-span-7" stagger={0.07}>
          <Accordion
            defaultValue={["origin-0"]}
            className="w-full space-y-3"
          >
            {TRANSPORT_DATA.items.map((item, index) => {
              const Icon = getOriginIcon(item.icon);
              const value = `origin-${index}`;

              return (
                <RevealItem key={item.origin} y={16}>
                <AccordionItem
                  value={value}
                  className="rounded-2xl border border-line bg-card shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)] px-5 md:px-6 transition-all data-open:border-primary/40 data-open:shadow-md"
                >
                  <AccordionTrigger className="items-center py-4 hover:no-underline gap-4 text-left font-heading font-semibold text-ink text-base md:text-lg min-h-[44px]">
                    <div className="flex items-center gap-3.5 flex-1">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="font-heading font-semibold text-ink text-base md:text-lg">
                        {item.origin}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <ul className="divide-y divide-line/60">
                      {item.fares.map((fare, fIndex) => (
                        <li
                          key={fIndex}
                          className="flex items-center justify-between py-3 text-sm md:text-base gap-4"
                        >
                          <span className="text-ink-muted font-normal">
                            {fare.mode}
                          </span>
                          <span className="font-semibold text-ink tabular-nums text-right shrink-0">
                            {fare.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                </RevealItem>
              );
            })}
          </Accordion>
        </RevealStagger>
      </div>
    </div>
  );
}
