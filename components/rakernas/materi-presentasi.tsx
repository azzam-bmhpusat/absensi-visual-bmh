import { CalendarDays, Download, Presentation, User } from "lucide-react";
import { CardLinkButton } from "@/components/rakernas/card-link-button";
import { getMateriPresentasi } from "@/lib/content/server";

/** Grid card materi presentasi Rakernas (dikelola di dashboard: Kelola Konten). */
export async function MateriPresentasi() {
  const MATERI_PRESENTASI = await getMateriPresentasi();
  if (MATERI_PRESENTASI.length === 0) return <p className="text-sm text-muted-foreground">Belum ada materi presentasi.</p>;
  return (
    <section aria-label="Materi presentasi" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {MATERI_PRESENTASI.map((materi) => (
        <article
          key={materi.judul}
          className="flex flex-col space-y-3 rounded-2xl border border-line bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-card/60"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green-deep/10 text-brand-green-deep dark:bg-brand-gold-soft/10 dark:text-brand-gold-soft">
              <Presentation className="size-5" aria-hidden />
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {materi.format} · {materi.ukuran}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{materi.judul}</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <User className="size-4 shrink-0" aria-hidden />
              {materi.pemateri} — {materi.jabatan}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {materi.sesi} · {materi.tanggal}
            </p>
          </div>
          <p className="pb-2 text-sm">{materi.deskripsi}</p>
          <CardLinkButton href={materi.driveUrl} label={`Unduh materi ${materi.judul}`}>
            <Download className="size-4" aria-hidden />
            Unduh Materi
          </CardLinkButton>
        </article>
      ))}
    </section>
  );
}
