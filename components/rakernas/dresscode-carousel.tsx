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
    <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
      {/* Judul & Deskripsi Bagian */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary">
          Dress Code
        </h2>
        <p className="mt-2 md:mt-3 text-ink-muted text-sm md:text-base max-w-xl mx-auto">
          Panduan busana dan seragam resmi peserta Rakernas BMH 2027
        </p>
      </div>

      {/* Carousel Dress Code */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {DRESSCODE_DATA.map((item) => (
              <CarouselItem
                key={item.src}
                className="basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-4"
              >
                <div className="group rounded-2xl border border-line bg-card overflow-hidden shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)] transition-all duration-300 hover:shadow-lg flex flex-col">
                  {/* Kontainer Gambar */}
                  <div className="relative aspect-[3/4] w-full bg-muted/30 overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Keterangan */}
                  <div className="p-4 border-t border-line text-center bg-card">
                    <span className="font-heading font-medium text-sm md:text-base text-primary">
                      {item.alt}
                    </span>
                  </div>
                </div>
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
                  "block h-2.5 rounded-full transition-all duration-300",
                  current === index
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-primary/25 hover:bg-primary/50"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
