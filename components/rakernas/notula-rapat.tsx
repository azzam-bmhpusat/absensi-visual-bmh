import { CalendarDays, FileText, MapPin, NotebookPen, User, Users } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { getNotulaRapat } from "@/lib/content/server";

/** Grid card notula rapat Rakernas (dikelola di dashboard: Kelola Konten). */
export async function NotulaRapat() {
  const NOTULA_RAPAT = await getNotulaRapat();
  if (NOTULA_RAPAT.length === 0) return <p className="text-sm text-muted-foreground">Belum ada notula rapat.</p>;
  return (
    <section aria-label="Notula rapat" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {NOTULA_RAPAT.map((notula) => (
        <article
          key={notula.judul}
          className="flex flex-col space-y-3 rounded-2xl border border-line bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-card/60"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green-deep/10 text-brand-green-deep dark:bg-brand-gold-soft/10 dark:text-brand-gold-soft">
              <NotebookPen className="size-5" aria-hidden />
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                notula.status === "Final"
                  ? "bg-brand-green-deep/10 text-brand-green-deep dark:bg-brand-green-deep/30 dark:text-white"
                  : "bg-brand-gold-soft/20 text-amber-800 dark:text-brand-gold-soft"
              )}
            >
              {notula.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{notula.judul}</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {notula.tanggal} · {notula.waktu}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {notula.tempat}
            </p>
            <p className="flex items-center gap-2">
              <User className="size-4 shrink-0" aria-hidden />
              {notula.pimpinan} · Notulis: {notula.notulis}
            </p>
            <p className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden />
              {notula.jumlahPeserta} peserta
            </p>
          </div>
          <div className="pb-2 text-sm">
            <p className="font-medium">Keputusan utama:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {notula.keputusan.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled
            className={cn(buttonVariants(), "!mt-auto w-full")}
          >
            <FileText className="size-4" aria-hidden />
            Lihat Notula
          </button>
        </article>
      ))}
    </section>
  );
}
