"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "cn";
import { LOCATION_DATA, JAKARTA_EXPLORE_GALLERY, type GalleryItem } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "@/lib/event-settings";
import { LocationMap } from "@/components/rakernas/location-map";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowUpRight, MapPin, ZoomIn } from "lucide-react";

export function LocationSection({ settings = DEFAULT_EVENT_SETTINGS }: { settings?: EventSettings } = {}) {
  const mapsButton = (className: string) => (
    <a
      href={settings.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Buka ${settings.venueName} di Google Maps (tab baru)`}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      Buka di Google Maps
      <ArrowUpRight aria-hidden="true" className="size-[18px]" />
    </a>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-5 md:px-8 lg:gap-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex flex-col gap-3 lg:w-[460px] lg:shrink-0 lg:gap-5">
          <p className="text-[11px] font-semibold tracking-[2px] text-[#1E7F62] uppercase lg:text-xs lg:tracking-[2.4px]">
            {LOCATION_DATA.title}
          </p>
          <h2 className="font-heading text-[28px] font-bold text-primary lg:text-[40px]/[46px]">{settings.venueName}</h2>
          <p className="flex gap-2.5 text-sm/[22px] text-[#4F7A72] lg:gap-3 lg:text-base/[26px]">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#1E7F62]" />
            {settings.venueAddress}
          </p>
          {mapsButton("hidden w-fit lg:inline-flex")}
        </div>
        <div className="min-w-0 flex-1 [&>div]:h-[220px] [&>div]:rounded-[20px] [&>div]:border-[#DCE8E5] md:[&>div]:h-[320px] lg:[&>div]:h-[400px] lg:[&>div]:rounded-3xl">
          <LocationMap location={settings} />
        </div>
        {mapsButton("w-full lg:hidden")}
      </div>

      <PhotoGallery
        title="Fasilitas Hotel"
        items={LOCATION_DATA.gallery}
        variant="portrait"
        altSuffix={settings.venueName}
        dialogDescription={`Foto fasilitas ${settings.venueName}`}
      />

      <PhotoGallery
        title="Jelajah Sekitar Blok M"
        items={JAKARTA_EXPLORE_GALLERY}
        variant="landscape"
        altSuffix="Blok M, Jakarta Selatan"
        dialogDescription="Jelajah sekitar Blok M, Jakarta Selatan"
      />
    </div>
  );
}

// Kelas Tailwind harus literal agar ikut ter-generate.
const GALLERY_VARIANTS = {
  portrait: {
    list: "lg:grid lg:grid-cols-5 lg:overflow-visible",
    item: "w-[150px] h-[200px] lg:w-auto lg:h-[300px]",
    aspect: "aspect-[3/4]",
    sizes: "(min-width: 1024px) 20vw, 150px",
    dialog: "max-w-sm",
    dialogSizes: "(max-width: 640px) 90vw, 384px",
  },
  landscape: {
    list: "",
    item: "w-[260px] h-[195px] lg:w-[360px] lg:h-[260px]",
    aspect: "aspect-[4/3]",
    sizes: "(min-width: 1024px) 360px, 260px",
    dialog: "max-w-3xl",
    dialogSizes: "(max-width: 768px) 90vw, 768px",
  },
} as const;

function PhotoGallery({
  title,
  items,
  variant,
  altSuffix,
  dialogDescription,
}: {
  title: string;
  items: GalleryItem[];
  variant: keyof typeof GALLERY_VARIANTS;
  altSuffix: string;
  dialogDescription: string;
}) {
  const v = GALLERY_VARIANTS[variant];
  const [selectedPhoto, setSelectedPhoto] = React.useState<GalleryItem | null>(null);

  return (
    <>
      <div className="flex flex-col gap-3 lg:gap-4">
        <h3 className="font-heading text-[17px] font-semibold text-primary lg:text-xl">{title}</h3>
        <ul
          className={cn(
            "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:scroll-px-8 lg:scroll-px-0 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:gap-4 lg:px-0 [&::-webkit-scrollbar]:hidden",
            v.list,
          )}
          data-lenis-prevent-horizontal
        >
          {items.map((photo, index) => (
            <li key={`${photo.src}-${index}`} className={cn("relative shrink-0 snap-start", v.item)}>
              <button
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="group relative block size-full cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-[18px]"
                aria-label={`Perbesar foto ${photo.caption} — ${altSuffix}`}
              >
                <Image
                  src={photo.src}
                  alt={`${photo.caption} — ${altSuffix}`}
                  fill
                  sizes={v.sizes}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-linear-to-b from-[#04362F00] from-50% to-[#04362FCC] lg:from-55%" />
                <span className="absolute inset-x-3 bottom-3 text-left text-[13px] font-semibold text-white lg:inset-x-4 lg:bottom-4 lg:text-sm">
                  <span className="line-clamp-1">{photo.caption}</span>
                  {photo.credit && <span className="mt-0.5 line-clamp-1 text-[10px] font-normal text-white/70">{photo.credit}</span>}
                </span>
                <span className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-primary opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <ZoomIn aria-hidden="true" className="size-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Dialog Modal Pembesaran Foto */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhoto(null);
        }}
      >
        <DialogContent className={cn("p-4 sm:p-6 overflow-hidden rounded-2xl border border-line bg-card text-foreground", v.dialog)}>
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg md:text-xl font-heading font-semibold text-primary">
              {selectedPhoto?.caption}
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-muted">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className={cn("relative w-full rounded-xl overflow-hidden bg-muted/40 border border-line", v.aspect)}>
              <Image
                src={selectedPhoto.src}
                alt={`${selectedPhoto.caption} — ${altSuffix}`}
                fill
                sizes={v.dialogSizes}
                className="object-contain"
                priority
              />
            </div>
          )}
          {selectedPhoto?.credit && (
            <p className="mt-2 text-xs text-ink-muted">{selectedPhoto.credit}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
