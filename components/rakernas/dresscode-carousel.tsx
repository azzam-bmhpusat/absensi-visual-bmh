"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "cn";
import { DRESSCODE_DATA } from "@/content/rakernas";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal } from "@/components/motion/reveal";

export function DresscodeSection() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const syncState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    syncState();

    api.on("select", syncState);
    api.on("reInit", syncState);

    return () => {
      api.off("select", syncState);
      api.off("reInit", syncState);
    };
  }, [api]);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-8">
      {/* Judul & Deskripsi Bagian */}
      <Reveal className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary">
          Dress Code
        </h2>
        <p className="mt-2 md:mt-3 text-ink-muted text-sm md:text-base max-w-xl mx-auto">
          Panduan busana dan seragam resmi peserta Rakernas BMH 2027
        </p>
      </Reveal>

      {/* Carousel Dress Code */}
      <Reveal className="relative" delay={0.1}>
        <Carousel
          opts={{
            align: "start",
          }}
          setApi={setApi}
          className="w-full [&_[data-slot=carousel-content]]:-mx-3 [&_[data-slot=carousel-content]]:px-3"
        >
          <CarouselContent className="-ml-4 py-4">
            {DRESSCODE_DATA.map((item) => (
              <CarouselItem
                key={item.src}
                className="flex basis-4/5 pl-4 sm:basis-1/2 lg:basis-1/3"
              >
                <article className="group flex h-full w-full flex-col rounded-[24px] border border-line bg-card p-3 shadow-[0_4px_12px_-4px_rgba(9,80,70,0.12)] transition-[border-color,box-shadow] duration-300 hover:border-brand-gold/60 hover:shadow-[0_8px_16px_-6px_rgba(9,80,70,0.2)] motion-reduce:transition-none">
                  {/* Kontainer Gambar */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-muted/30">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1280px) 365px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw"
                      className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
                      loading="lazy"
                    />
                  </div>

                  {/* Keterangan */}
                  <div className="flex flex-1 flex-col items-start px-2 pt-5 pb-2 text-left">
                    <h3 className="inline-flex rounded-full bg-primary px-3.5 py-1.5 font-heading text-sm font-semibold text-primary-foreground">
                      {item.day}
                    </h3>
                    <span className="my-3 h-0.5 w-10 rounded-full bg-brand-gold" aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-ink-muted">
                      {item.desc}
                    </p>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Tombol Panah Navigasi (Hanya muncul mulai breakpoint md) */}
          <CarouselPrevious className="hidden md:inline-flex -left-4 lg:-left-6 bg-card hover:bg-muted text-primary border-line shadow-md" />
          <CarouselNext className="hidden md:inline-flex -right-4 lg:-right-6 bg-card hover:bg-muted text-primary border-line shadow-md" />
        </Carousel>

        {/* Titik Indikator Pagination */}
        <div
          className="flex items-center justify-center gap-1 mt-6 md:mt-8"
          role="tablist"
          aria-label="Navigasi slide dress code"
        >
          {Array.from({ length: count || DRESSCODE_DATA.length }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
              aria-label={`Pilih slide dress code ${index + 1}`}
              aria-selected={current === index}
              role="tab"
            >
              <span
                className={cn(
                  "block h-2.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  current === index
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-primary/25 hover:bg-primary/50"
                )}
              />
            </button>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
