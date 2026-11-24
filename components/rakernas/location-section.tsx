"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "cn";
import { LOCATION_DATA, type GalleryItem } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "@/lib/event-settings";
import { LocationMap } from "@/components/rakernas/location-map";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapPin, ExternalLink, ZoomIn } from "lucide-react";

export function LocationSection({ settings = DEFAULT_EVENT_SETTINGS }: { settings?: EventSettings } = {}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [selectedPhoto, setSelectedPhoto] = React.useState<GalleryItem | null>(null);

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
      {/* Header Bagian */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-heading font-semibold text-primary">
          {LOCATION_DATA.title}
        </h2>
        <p className="mt-2 md:mt-3 text-ink-muted text-sm md:text-base max-w-xl mx-auto">
          Lokasi penyelenggaraan acara di {settings.venueName}
        </p>
      </div>

      {/* Peta lokasi dimuat ketika mendekati layar */}
      <div className="mb-6 md:mb-8">
        <LocationMap location={settings} />
      </div>

      {/* Kartu Informasi Alamat & Tombol Google Map */}
      <div className="mb-8 md:mb-12">
        <div className="rounded-2xl border border-line bg-card p-6 md:p-8 shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="size-12 shrink-0 rounded-full bg-green-100 text-primary flex items-center justify-center">
              <MapPin className="size-6" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-heading font-semibold text-primary">
                {settings.venueName}
              </h3>
              <p className="mt-1 text-sm md:text-base text-ink-muted leading-relaxed max-w-2xl">
                {settings.venueAddress}
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <Button
              nativeButton={false}
              render={
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              aria-label={`Buka ${settings.venueName} di Google Maps (tab baru)`}
              className="h-auto min-h-12 py-3 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-medium shadow-md w-full sm:w-auto text-base whitespace-normal text-center transition-colors inline-flex items-center justify-center gap-2"
            >
              <MapPin className="size-5 shrink-0" />
              <span>Buka di Google Maps</span>
              <ExternalLink className="size-4 shrink-0 opacity-80" />
            </Button>
          </div>
        </div>
      </div>

      {/* Galeri Foto Lokasi: foto potret kecil (224x298), jadi kartu 3:4 dan sempit agar tidak buram */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-heading font-semibold text-primary">
              Galeri Fasilitas Hotel
            </h3>
            <p className="text-sm text-ink-muted mt-1">
              Ketuk foto untuk memperbesar
            </p>
          </div>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {LOCATION_DATA.gallery.map((photo, index) => (
                <CarouselItem
                  key={`${photo.src}-${index}`}
                  className="basis-[70%] sm:basis-1/3 lg:basis-1/5 pl-4"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="group w-full text-left rounded-2xl border border-line bg-card overflow-hidden shadow-[0_8px_24px_-8px_rgba(19,75,64,0.18)] transition-all duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col cursor-pointer"
                    aria-label={`Perbesar foto ${photo.caption} — ${settings.venueName}`}
                  >
                    <div className="relative aspect-[3/4] w-full bg-muted/40 overflow-hidden">
                      <Image
                        src={photo.src}
                        alt={`${photo.caption} — ${settings.venueName}`}
                        fill
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Overlay ikon pembesar saat hover */}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-white/95 text-primary shadow-md backdrop-blur-xs">
                          <ZoomIn className="size-5" />
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 md:p-4 bg-card border-t border-line">
                      <p className="font-heading font-medium text-sm md:text-base text-ink line-clamp-1">
                        {photo.caption}
                      </p>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Tombol Panah Navigasi Galeri (Mulai md) */}
            <CarouselPrevious className="hidden md:inline-flex -left-4 lg:-left-6 bg-card hover:bg-muted text-primary border-line shadow-md" />
            <CarouselNext className="hidden md:inline-flex -right-4 lg:-right-6 bg-card hover:bg-muted text-primary border-line shadow-md" />
          </Carousel>

          {/* Titik Indikator Pagination Galeri (disembunyikan bila semua foto sudah terlihat) */}
          <div
            className={cn("flex items-center justify-center gap-1 mt-6 md:mt-8", count === 1 && "hidden")}
            role="tablist"
            aria-label="Navigasi galeri foto lokasi"
          >
            {Array.from({ length: count || LOCATION_DATA.gallery.length }).map(
              (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  aria-label={`Pilih slide galeri ${index + 1}`}
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
              )
            )}
          </div>
        </div>
      </div>

      {/* Dialog Modal Pembesaran Foto */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhoto(null);
        }}
      >
        <DialogContent className="max-w-sm p-4 sm:p-6 overflow-hidden rounded-2xl border border-line bg-card text-foreground">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg md:text-xl font-heading font-semibold text-primary">
              {selectedPhoto?.caption}
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-muted">
              Foto fasilitas {settings.venueName}
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted/40 border border-line">
              <Image
                src={selectedPhoto.src}
                alt={`${selectedPhoto.caption} — ${settings.venueName}`}
                fill
                sizes="(max-width: 640px) 90vw, 384px"
                className="object-contain"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
