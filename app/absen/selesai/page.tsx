import { Check } from "lucide-react";

export default function AbsenSelesaiPage() {
  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm mx-auto text-center space-y-6 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-line shadow-sm">
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-green flex items-center justify-center shadow-md animate-in zoom-in duration-300">
          <Check className="w-10 h-10 text-white stroke-[2.5]" />
        </div>
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-secondary text-primary border border-brand-green/20">
            Presensi Berhasil
          </span>
          <h1 className="font-heading text-2xl font-bold text-primary tracking-tight">
            Kehadiran Tercatat
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Terima kasih telah melakukan konfirmasi kehadiran. Halaman ini telah selesai dan dapat Anda tutup.
          </p>
        </div>
        <div className="pt-4 border-t border-line/60">
          <p className="text-[11px] text-ink-muted/80">
            Baitul Maal Hidayatullah &bull; Rapat Kerja Nasional
          </p>
        </div>
      </div>
    </main>
  );
}
