import Image from "next/image";
import { CalendarDays, ExternalLink, Images, MapPin } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { getAlbumKegiatan } from "@/lib/content/server";

/** Grid card album foto kegiatan Rakernas (dikelola di dashboard: Kelola Konten). */
export async function GaleriKegiatan() {
  const ALBUM_KEGIATAN = await getAlbumKegiatan();
  if (ALBUM_KEGIATAN.length === 0) return <p className="text-sm text-muted-foreground">Belum ada album foto.</p>;
  return (
    <section aria-label="Album foto kegiatan" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ALBUM_KEGIATAN.map((album) => (
        <article
          key={album.judul}
          className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-card/60"
        >
          <div className="relative aspect-[4/3]">
            <Image
              src={album.cover}
              alt={album.judul}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Images className="size-3.5" aria-hidden />
              {album.jumlahFoto} foto
            </span>
          </div>
          <div className="flex flex-1 flex-col space-y-2 p-5">
            <h3 className="text-lg font-semibold">{album.judul}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                {album.tanggal}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {album.lokasi}
              </p>
            </div>
            <p className="pb-2 text-sm">{album.deskripsi}</p>
            <button
              type="button"
              disabled
              className={cn(buttonVariants(), "!mt-auto w-full")}
            >
              Lihat Foto di Google Drive
              <ExternalLink className="size-4" aria-hidden />
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
